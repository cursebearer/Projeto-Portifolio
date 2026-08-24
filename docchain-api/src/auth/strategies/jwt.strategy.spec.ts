import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { cookieExtractor, JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: { findById: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    authService = { findById: jest.fn() };
    config = { get: jest.fn().mockReturnValue('a'.repeat(32)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('cookieExtractor', () => {
    it('retorna access_token do cookie', () => {
      const req = { cookies: { access_token: 'jwt-value' } } as unknown as Request;
      expect(cookieExtractor(req)).toBe('jwt-value');
    });

    it('retorna null quando cookies ausentes', () => {
      const req = {} as Request;
      expect(cookieExtractor(req)).toBeNull();
    });

    it('retorna null quando access_token ausente', () => {
      const req = { cookies: { outro: 'x' } } as unknown as Request;
      expect(cookieExtractor(req)).toBeNull();
    });
  });

  describe('validate', () => {
    it('retorna AuthenticatedUser quando payload válido', async () => {
      const user = {
        id: 'uid-1',
        email: 'r@r.com',
        name: 'R',
        createdAt: new Date(),
      };
      authService.findById.mockResolvedValue(user);

      const result = await strategy.validate({
        sub: 'uid-1',
        email: 'r@r.com',
      });

      expect(authService.findById).toHaveBeenCalledWith('uid-1');
      expect(result).toBe(user);
    });

    it('lança Unauthorized se usuário não existe (sessão inválida)', async () => {
      authService.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'ghost', email: 'g@g.com' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('constructor', () => {
    it('lança se JWT_SECRET ausente', () => {
      const badConfig = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;
      expect(
        () =>
          new JwtStrategy(
            { findById: jest.fn() } as unknown as AuthService,
            badConfig,
          ),
      ).toThrow(/JWT_SECRET/);
    });
  });
});
