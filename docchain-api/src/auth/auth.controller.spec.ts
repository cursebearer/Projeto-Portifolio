import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction } from '@prisma/client';
import { Response } from 'express';
import { AuditLogService } from '../audit/audit-log.service';
import { AccountService } from './account.service';
import { AuthController } from './auth.controller';
import { AuthService, AuthenticatedUser } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };
  let config: { get: jest.Mock };
  let audit: { log: jest.Mock };
  let account: {
    updateName: jest.Mock;
    exportData: jest.Mock;
    deleteAccount: jest.Mock;
  };

  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  const makeRes = () =>
    ({
      cookie: jest.fn(),
    }) as unknown as Response & { cookie: jest.Mock };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };
    config = { get: jest.fn() };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    account = {
      updateName: jest.fn(),
      exportData: jest.fn(),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
        { provide: AuditLogService, useValue: audit },
        { provide: AccountService, useValue: account },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('delega ao AuthService.register', async () => {
      authService.register.mockResolvedValue(user);
      const dto = { email: 'r@r.com', password: 'abcdefgh', name: 'R' };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe(user);
    });
  });

  describe('POST /auth/login', () => {
    it('emite cookie httpOnly + retorna { user }', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'jwt-abc',
        expiresInSeconds: 900,
        user,
      });
      config.get.mockReturnValue('development');
      const res = makeRes();

      const result = await controller.login(
        { email: 'r@r.com', password: 'abcdefgh' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'jwt-abc', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 900 * 1000,
      });
      expect(result).toEqual({ user });
      expect(result).not.toHaveProperty('accessToken');
    });

    it('em produção seta cookie com secure:true', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'jwt-prod',
        expiresInSeconds: 900,
        user,
      });
      config.get.mockReturnValue('production');
      const res = makeRes();

      await controller.login({ email: 'r@r.com', password: 'abcdefgh' }, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-prod',
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('apaga cookie (maxAge 0) + grava LOGOUT no audit', async () => {
      config.get.mockReturnValue('development');
      const res = makeRes();

      await controller.logout(user, res);

      expect(res.cookie).toHaveBeenCalledWith('access_token', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      expect(audit.log).toHaveBeenCalledWith({
        action: AuditAction.LOGOUT,
        userId: user.id,
      });
    });

    it('em produção apaga com secure:true', async () => {
      config.get.mockReturnValue('production');
      const res = makeRes();

      await controller.logout(user, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        '',
        expect.objectContaining({ secure: true, maxAge: 0 }),
      );
    });
  });

  describe('GET /auth/me', () => {
    it('devolve o usuário injetado pelo decorator', () => {
      expect(controller.me(user)).toBe(user);
    });
  });

  describe('conta (LGPD)', () => {
    it('PATCH /auth/me atualiza o nome do usuário logado', async () => {
      account.updateName.mockResolvedValue({ ...user, name: 'Novo' });

      const result = await controller.updateMe(user, { name: 'Novo' });

      expect(account.updateName).toHaveBeenCalledWith('u1', 'Novo');
      expect(result.name).toBe('Novo');
    });

    it('GET /auth/me/export delega ao AccountService', async () => {
      const data = { exportedAt: 'x', user, documents: [], shares: [] };
      account.exportData.mockResolvedValue(data);

      await expect(controller.exportMe(user)).resolves.toBe(data);
      expect(account.exportData).toHaveBeenCalledWith('u1');
    });

    it('DELETE /auth/me exclui a conta e apaga o cookie', async () => {
      config.get.mockReturnValue('development');
      const res = makeRes();

      await controller.deleteMe(user, { password: 'senha12345' }, res);

      expect(account.deleteAccount).toHaveBeenCalledWith('u1', 'senha12345');
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        '',
        expect.objectContaining({ maxAge: 0, httpOnly: true }),
      );
    });

    it('DELETE /auth/me não apaga o cookie se a exclusão falhar', async () => {
      account.deleteAccount.mockRejectedValue(new Error('Senha incorreta.'));
      const res = makeRes();

      await expect(
        controller.deleteMe(user, { password: 'x' }, res),
      ).rejects.toThrow('Senha incorreta.');
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
