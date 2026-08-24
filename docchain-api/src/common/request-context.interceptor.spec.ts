import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestContextInterceptor } from './request-context.interceptor';
import { RequestContextService } from './request-context.service';

describe('RequestContextInterceptor', () => {
  let interceptor: RequestContextInterceptor;
  let ctx: RequestContextService;

  beforeEach(() => {
    ctx = new RequestContextService();
    interceptor = new RequestContextInterceptor(ctx);
  });

  const makeExecCtx = (req: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as unknown as ExecutionContext;

  const handler = (produced: () => unknown): CallHandler =>
    ({
      handle: () => of(produced()),
    }) as unknown as CallHandler;

  it('captura ip + userAgent + userId em store ALS', (done) => {
    const req = {
      ip: '10.0.0.1',
      headers: { 'user-agent': 'jest' },
      user: { id: 'user-42' },
    };
    interceptor
      .intercept(
        makeExecCtx(req),
        handler(() => ctx.get()),
      )
      .subscribe({
        next: (value) => {
          expect(value).toEqual({
            ipAddress: '10.0.0.1',
            userAgent: 'jest',
            userId: 'user-42',
          });
          done();
        },
      });
  });

  it('userId undefined quando request não tem user', (done) => {
    const req = { ip: '1.2.3.4', headers: {} };
    interceptor
      .intercept(
        makeExecCtx(req),
        handler(() => ctx.get()),
      )
      .subscribe({
        next: (value) => {
          expect(value).toMatchObject({ userId: undefined });
          done();
        },
      });
  });
});
