import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let audit: { log: jest.Mock };

  const bcryptHash = bcrypt.hash as jest.Mock;
  const bcryptCompare = bcrypt.compare as jest.Mock;

  const userRow = {
    id: 'user-uuid-1',
    email: 'rafa@example.com',
    passwordHash: 'stored-hash',
    name: 'Rafa',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn() };
    config = { get: jest.fn() };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    bcryptHash.mockReset();
    bcryptCompare.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('cria usuário com senha hasheada (bcrypt 10 rounds)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(userRow);
      bcryptHash.mockResolvedValue('hashed-pw');

      const result = await service.register({
        email: 'rafa@example.com',
        password: 'senha-forte-123',
        name: 'Rafa',
      });

      expect(bcryptHash).toHaveBeenCalledWith('senha-forte-123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'rafa@example.com',
          passwordHash: 'hashed-pw',
          name: 'Rafa',
        },
      });
      expect(result).toEqual({
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: userRow.createdAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('name default null quando omitido', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...userRow, name: null });
      bcryptHash.mockResolvedValue('h');

      await service.register({
        email: 'x@x.com',
        password: 'abcdefgh',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'x@x.com', passwordHash: 'h', name: null },
      });
    });

    it('lança ConflictException se email já existe', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);

      await expect(
        service.register({
          email: 'rafa@example.com',
          password: 'senha-forte-123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('grava REGISTER no audit log após sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(userRow);
      bcryptHash.mockResolvedValue('h');

      await service.register({
        email: 'rafa@example.com',
        password: 'abcdefgh',
        name: 'Rafa',
      });

      expect(audit.log).toHaveBeenCalledWith({
        action: 'REGISTER',
        userId: userRow.id,
        resourceType: 'User',
        resourceId: userRow.id,
      });
    });
  });

  describe('login', () => {
    it('retorna accessToken + user quando credenciais válidas', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(true);
      config.get.mockReturnValue('15m');
      jwt.signAsync.mockResolvedValue('signed-jwt');

      const result = await service.login({
        email: 'rafa@example.com',
        password: 'senha-forte-123',
      });

      expect(bcryptCompare).toHaveBeenCalledWith(
        'senha-forte-123',
        userRow.passwordHash,
      );
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: userRow.id, email: userRow.email },
        expect.objectContaining({ expiresIn: '15m' }),
      );
      expect(result.accessToken).toBe('signed-jwt');
      expect(result.expiresInSeconds).toBe(900);
      expect(result.user).toEqual({
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: userRow.createdAt,
      });
    });

    it('lança Unauthorized se usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'abcdefgh' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('lança Unauthorized se senha errada', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'rafa@example.com', password: 'errada12' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('audit registra LOGIN success com userId', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(true);
      config.get.mockReturnValue('15m');
      jwt.signAsync.mockResolvedValue('t');

      await service.login({ email: 'rafa@example.com', password: 'ok12ok12' });

      expect(audit.log).toHaveBeenCalledWith({
        action: 'LOGIN',
        userId: userRow.id,
        metadata: { success: true },
      });
    });

    it('audit registra LOGIN failed com userId=null quando user não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'abcdefgh' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith({
        action: 'LOGIN',
        userId: null,
        metadata: {
          success: false,
          email: 'x@x.com',
          reason: 'user_not_found',
        },
      });
    });

    it('audit registra LOGIN failed com userId real quando senha errada', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'rafa@example.com', password: 'errada12' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith({
        action: 'LOGIN',
        userId: userRow.id,
        metadata: { success: false, reason: 'wrong_password' },
      });
    });

    describe('parseExpiresInSeconds (via login)', () => {
      const cases: Array<[string, number]> = [
        ['30s', 30],
        ['15m', 900],
        ['2h', 7200],
        ['1d', 86400],
        ['45', 45],
        ['banana', 900],
      ];

      it.each(cases)('expiresIn %s → %d segundos', async (input, expected) => {
        prisma.user.findUnique.mockResolvedValue(userRow);
        bcryptCompare.mockResolvedValue(true);
        config.get.mockReturnValue(input);
        jwt.signAsync.mockResolvedValue('t');

        const result = await service.login({
          email: 'r@r.com',
          password: 'abcdefgh',
        });
        expect(result.expiresInSeconds).toBe(expected);
      });
    });
  });

  describe('findById', () => {
    it('retorna AuthenticatedUser quando encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow);
      const result = await service.findById(userRow.id);
      expect(result).toEqual({
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: userRow.createdAt,
      });
    });

    it('retorna null quando não encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findById('inexistente');
      expect(result).toBeNull();
    });
  });
});
