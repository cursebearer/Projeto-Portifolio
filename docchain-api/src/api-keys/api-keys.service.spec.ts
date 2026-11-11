import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_KEY_PREFIX,
  ApiKeysService,
  MAX_ACTIVE_KEYS,
  hashApiKey,
} from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: {
    apiKey: {
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };

  const owner = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      apiKey: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get(ApiKeysService);
  });

  describe('create', () => {
    beforeEach(() => {
      prisma.apiKey.create.mockImplementation(
        ({ data }: { data: { prefix: string; name: string } }) =>
          Promise.resolve({
            id: 'k1',
            name: data.name,
            prefix: data.prefix,
            createdAt: new Date(),
            lastUsedAt: null,
          }),
      );
    });

    it('gera chave com prefixo dc_live_ e devolve ela uma única vez', async () => {
      const result = await service.create('u1', 'ERP');

      expect(result.key.startsWith(API_KEY_PREFIX)).toBe(true);
      expect(result.key.length).toBeGreaterThan(API_KEY_PREFIX.length + 20);
      expect(result.prefix).toBe(
        result.key.slice(0, API_KEY_PREFIX.length + 4),
      );
    });

    it('salva só o hash SHA-256, nunca a chave em texto', async () => {
      const result = await service.create('u1', 'ERP');

      const [{ data }] = prisma.apiKey.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data.keyHash).toBe(hashApiKey(result.key));
      expect(Object.values(data)).not.toContain(result.key);
    });

    it('registra API_KEY_CREATE na auditoria', async () => {
      await service.create('u1', 'ERP');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.API_KEY_CREATE,
          userId: 'u1',
          resourceId: 'k1',
        }),
      );
    });

    it(`recusa a ${MAX_ACTIVE_KEYS + 1}ª chave ativa (409)`, async () => {
      prisma.apiKey.count.mockResolvedValue(MAX_ACTIVE_KEYS);

      await expect(service.create('u1', 'ERP')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.apiKey.create).not.toHaveBeenCalled();
      expect(prisma.apiKey.count).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
      });
    });

    it('chaves geradas são diferentes a cada chamada', async () => {
      const a = await service.create('u1', 'A');
      const b = await service.create('u1', 'B');
      expect(a.key).not.toBe(b.key);
    });
  });

  it('list traz só as chaves ativas do usuário, sem o hash', async () => {
    prisma.apiKey.findMany.mockResolvedValue([]);

    await service.list('u1');

    const [query] = prisma.apiKey.findMany.mock.calls[0] as [
      { where: unknown; select: Record<string, boolean> },
    ];
    expect(query.where).toEqual({ userId: 'u1', revokedAt: null });
    expect(query.select.keyHash).toBeUndefined();
  });

  describe('revoke', () => {
    it('marca revokedAt e registra API_KEY_REVOKE', async () => {
      prisma.apiKey.findFirst.mockResolvedValue({
        id: 'k1',
        prefix: 'dc_live_abcd',
      });

      await service.revoke('u1', 'k1');

      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'k1', userId: 'u1', revokedAt: null },
        }),
      );
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'k1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.API_KEY_REVOKE }),
      );
    });

    it('chave de outro usuário ou já revogada → 404', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('u1', 'k9')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.apiKey.update).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    const rawKey = `${API_KEY_PREFIX}abcdefghijklmnopqrstuvwxyz012345`;

    it('chave válida → devolve o dono e atualiza lastUsedAt', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        id: 'k1',
        revokedAt: null,
        user: owner,
      });

      const result = await service.validate(rawKey);

      expect(result).toEqual({ user: owner, apiKeyId: 'k1' });
      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { keyHash: hashApiKey(rawKey) } }),
      );
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'k1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('formato sem o prefixo → 401 sem consultar o banco', async () => {
      await expect(service.validate('qualquer-coisa')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it('chave inexistente → 401', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(service.validate(rawKey)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('chave revogada → 401', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        id: 'k1',
        revokedAt: new Date(),
        user: owner,
      });

      await expect(service.validate(rawKey)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.apiKey.update).not.toHaveBeenCalled();
    });
  });
});
