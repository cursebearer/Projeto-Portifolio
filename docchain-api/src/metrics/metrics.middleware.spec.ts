import { EventEmitter } from 'events';
import type { Request, Response } from 'express';
import { MetricsMiddleware, resolveRoute } from './metrics.middleware';
import { MetricsService } from './metrics.service';

describe('MetricsMiddleware', () => {
  const observeRequest = jest.fn();
  const metrics = { observeRequest } as unknown as MetricsService;
  const middleware = new MetricsMiddleware(metrics);

  function run(req: Partial<Request>, statusCode = 200) {
    const res = new EventEmitter() as EventEmitter & { statusCode: number };
    res.statusCode = statusCode;
    const next = jest.fn();
    middleware.use(req as Request, res as unknown as Response, next);
    return { res, next };
  }

  beforeEach(() => jest.clearAllMocks());

  it('chama next e observa a requisição ao terminar', () => {
    const req = {
      method: 'GET',
      baseUrl: '',
      route: { path: '/documents/:id' },
    };
    const { res, next } = run(req, 404);
    expect(next).toHaveBeenCalled();
    expect(observeRequest).not.toHaveBeenCalled();
    res.emit('finish');
    expect(observeRequest).toHaveBeenCalledWith(
      'GET',
      '/documents/:id',
      404,
      expect.any(Number),
    );
  });

  it('ignora o próprio endpoint /metrics', () => {
    const { res } = run({
      method: 'GET',
      baseUrl: '',
      route: { path: '/metrics' },
    });
    res.emit('finish');
    expect(observeRequest).not.toHaveBeenCalled();
  });

  it('rota sem match vira "unmatched"', () => {
    expect(resolveRoute({ baseUrl: '' } as Request)).toBe('unmatched');
  });

  it('concatena baseUrl com o path da rota', () => {
    expect(
      resolveRoute({
        baseUrl: '/api',
        route: { path: '/x' },
      } as unknown as Request),
    ).toBe('/api/x');
  });
});
