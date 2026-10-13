import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { AccountService } from './account.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AccountService', () => {
  let service: AccountService;
  let prisma: {
    user: { update: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    document: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    documentShare: { findMany: jest.Mock; deleteMany: jest.Mock };
    verificationAttempt: { updateMany: jest.Mock };
    auditLog: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let storage: { delete: jest.Mock };

  const user = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn().mockReturnValue('op:user.delete'),
      },
      document: {
        findMany: jest.fn(),
        updateMany: jest.fn().mockReturnValue('op:document.updateMany'),
        deleteMany: jest.fn().mockReturnValue('op:document.deleteMany'),
      },
      documentShare: {
        findMany: jest.fn(),
        deleteMany: jest.fn().mockReturnValue('op:share.deleteMany'),
      },
      verificationAttempt: {
        updateMany: jest.fn().mockReturnValue('op:attempt.updateMany'),
      },
      auditLog: {
        updateMany: jest.fn().mockReturnValue('op:audit.updateMany'),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    storage = { delete: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: STORAGE_SERVICE, useValue: storage },
      ],
    }).compile();
    service = module.get(AccountService);
    (bcrypt.compare as jest.Mock).mockReset();
  });

  describe('updateName', () => {
    it('atualiza só o nome e retorna campos públicos', async () => {
      prisma.user.update.mockResolvedValue({ ...user, name: 'Novo' });

      const result = await service.updateName('u1', 'Novo');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { name: 'Novo' },
        select: { id: true, email: true, name: true, createdAt: true },
      });
      expect(result.name).toBe('Novo');
    });
  });

  describe('exportData', () => {
    it('retorna usuário, documentos (inclusive excluídos) e compartilhamentos', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.document.findMany.mockResolvedValue([{ id: 'd1', hash: 'h1' }]);
      prisma.documentShare.findMany.mockResolvedValue([
        { documentId: 'd1', sharedWithEmail: 'x@y.com' },
      ]);

      const result = await service.exportData('u1');

      expect(result.user).toBe(user);
      expect(result.documents).toEqual([{ id: 'd1', hash: 'h1' }]);
      expect(result.shares).toHaveLength(1);
      expect(typeof result.exportedAt).toBe('string');
      const [docQuery] = prisma.document.findMany.mock.calls[0] as [
        { where: unknown; select: Record<string, boolean> },
      ];
      expect(docQuery.where).toEqual({ userId: 'u1' });
      expect(docQuery.select.encryptionIv).toBeUndefined();
      expect(docQuery.select.encryptionAuthTag).toBeUndefined();
    });

    it('usuário inexistente → 404', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.exportData('u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        passwordHash: 'hash',
      });
      prisma.document.findMany.mockResolvedValue([
        { id: 'd1', hash: 'h1', deletedAt: null },
        { id: 'd2', hash: 'h2', deletedAt: new Date() },
      ]);
    });

    it('senha incorreta → 403 e nada é apagado', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteAccount('u1', 'errada'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.delete).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('apaga arquivos cifrados ativos, anonimiza trilhas e remove dados em transação', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.deleteAccount('u1', 'certa');

      expect(storage.delete).toHaveBeenCalledTimes(1);
      expect(storage.delete).toHaveBeenCalledWith('h1');
      expect(prisma.auditLog.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: 'u1' },
            { metadata: { path: ['email'], equals: 'r@r.com' } },
          ],
        },
        data: { userId: null, metadata: Prisma.DbNull },
      });
      expect(prisma.verificationAttempt.updateMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: 'u1' }, { documentId: { in: ['d1', 'd2'] } }] },
        data: { userId: null, documentId: null },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith([
        'op:share.deleteMany',
        'op:attempt.updateMany',
        'op:audit.updateMany',
        'op:document.updateMany',
        'op:document.deleteMany',
        'op:user.delete',
      ]);
    });

    it('falha ao apagar arquivo não impede a exclusão da conta', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      storage.delete.mockRejectedValue(new Error('EACCES'));

      await service.deleteAccount('u1', 'certa');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('usuário inexistente → 404', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteAccount('u1', 'x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
