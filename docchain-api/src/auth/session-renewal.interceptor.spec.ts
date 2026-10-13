import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { lastValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';
import { SessionRenewalInterceptor } from './session-renewal.interceptor';

describe('SessionRenewalInterceptor', () => {
  const user = { id: 'u1', email: 'r@r.com', name: 'R', createdAt: new Date() };
  let jwt: { decode: jest.Mock };
  let auth: { issueAccessToken: jest.Mock };
  let interceptor: SessionRenewalInterceptor;
  let res: { cookie: jest.Mock };
  const next: CallHandler = { handle: () => of('resultado') };

  function context(req: Record<string, unknown>): ExecutionContext {
    return {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    } as unknown as ExecutionContext;
  }

  function tokenTimes(issuedSecondsAgo: number, ttlSeconds = 900) {
    const now = Math.floor(Date.now() / 1000);
    return {
      iat: now - issuedSecondsAgo,
      exp: now - issuedSecondsAgo + ttlSeconds,
    };
  }

  beforeEach(() => {
    jwt = { decode: jest.fn() };
    auth = {
      issueAccessToken: jest
        .fn()
        .mockResolvedValue({ accessToken: 'novo-jwt', expiresInSeconds: 900 }),
    };
    res = { cookie: jest.fn() };
    interceptor = new SessionRenewalInterceptor(
      jwt as unknown as JwtService,
      auth as unknown as AuthService,
      {
        get: jest.fn().mockReturnValue('development'),
      } as unknown as ConfigService,
    );
  });

  it('renova o cookie quando o token passou da metade da validade', async () => {
    jwt.decode.mockReturnValue(tokenTimes(600));

    const result = await lastValueFrom(
      interceptor.intercept(
        context({ user, cookies: { access_token: 'velho' } }),
        next,
      ),
    );

    expect(result).toBe('resultado');
    expect(auth.issueAccessToken).toHaveBeenCalledWith(user);
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'novo-jwt',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 900_000,
      }),
    );
  });

  it('não renova token recente', async () => {
    jwt.decode.mockReturnValue(tokenTimes(60));

    await lastValueFrom(
      interceptor.intercept(
        context({ user, cookies: { access_token: 'recente' } }),
        next,
      ),
    );

    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('ignora requisições sem usuário autenticado', async () => {
    await lastValueFrom(interceptor.intercept(context({ cookies: {} }), next));

    expect(jwt.decode).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('falha ao renovar não quebra a requisição', async () => {
    jwt.decode.mockReturnValue(tokenTimes(600));
    auth.issueAccessToken.mockRejectedValue(new Error('boom'));

    await expect(
      lastValueFrom(
        interceptor.intercept(
          context({ user, cookies: { access_token: 'velho' } }),
          next,
        ),
      ),
    ).resolves.toBe('resultado');
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('ignora contextos que não são HTTP', async () => {
    const ctx = { getType: () => 'rpc' } as unknown as ExecutionContext;
    await expect(lastValueFrom(interceptor.intercept(ctx, next))).resolves.toBe(
      'resultado',
    );
  });
});
