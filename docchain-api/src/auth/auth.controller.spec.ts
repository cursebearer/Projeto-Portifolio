import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, AuthenticatedUser } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };
  let config: { get: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
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

      await controller.login(
        { email: 'r@r.com', password: 'abcdefgh' },
        res,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-prod',
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('apaga cookie (maxAge 0)', () => {
      config.get.mockReturnValue('development');
      const res = makeRes();

      controller.logout(res);

      expect(res.cookie).toHaveBeenCalledWith('access_token', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    });

    it('em produção apaga com secure:true', () => {
      config.get.mockReturnValue('production');
      const res = makeRes();

      controller.logout(res);

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
});
