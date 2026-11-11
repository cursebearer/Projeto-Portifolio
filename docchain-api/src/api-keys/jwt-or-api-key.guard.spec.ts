import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { JwtOrApiKeyGuard, RequestWithApiKey } from './jwt-or-api-key.guard';

describe('JwtOrApiKeyGuard', () => {
  const owner = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date(),
  };

  let reflector: { getAllAndOverride: jest.Mock };
  let apiKeys: { validate: jest.Mock };
  let guard: JwtOrApiKeyGuard;

  const contextFor = (req: Partial<RequestWithApiKey>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => () => undefined,
      getClass: () => class {},
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    apiKeys = {
      validate: jest.fn().mockResolvedValue({ user: owner, apiKeyId: 'k1' }),
    };
    guard = new JwtOrApiKeyGuard(
      reflector as unknown as Reflector,
      apiKeys as unknown as ApiKeysService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('sem header X-API-Key → usa o login por cookie (JwtAuthGuard)', async () => {
    const jwtSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true);

    const ok = await guard.canActivate(contextFor({ headers: {} }));

    expect(ok).toBe(true);
    expect(jwtSpy).toHaveBeenCalled();
    expect(apiKeys.validate).not.toHaveBeenCalled();
  });

  it('com chave em rota liberada → autentica o dono da chave', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const req: Partial<RequestWithApiKey> = {
      headers: { 'x-api-key': 'dc_live_abc' },
    };

    const ok = await guard.canActivate(contextFor(req));

    expect(ok).toBe(true);
    expect(apiKeys.validate).toHaveBeenCalledWith('dc_live_abc');
    expect(req.user).toBe(owner);
    expect(req.apiKeyId).toBe('k1');
  });

  it('com chave em rota não liberada → 403 sem validar a chave', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(
        contextFor({ headers: { 'x-api-key': 'dc_live_abc' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(apiKeys.validate).not.toHaveBeenCalled();
  });

  it('chave inválida → propaga o 401 do service', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    apiKeys.validate.mockRejectedValue(new Error('401'));

    await expect(
      guard.canActivate(contextFor({ headers: { 'x-api-key': 'dc_live_x' } })),
    ).rejects.toThrow('401');
  });
});
