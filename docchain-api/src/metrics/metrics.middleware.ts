import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Mede toda requisição HTTP. Usa o path da rota (ex: /documents/:id) para
 * não explodir a cardinalidade com ids; rota desconhecida vira "unmatched".
 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const route = resolveRoute(req);
      if (route === '/metrics') return;
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      this.metrics.observeRequest(req.method, route, res.statusCode, seconds);
    });
    next();
  }
}

export function resolveRoute(req: Request): string {
  const routePath = (req.route as { path?: string } | undefined)?.path;
  if (!routePath) return 'unmatched';
  return `${req.baseUrl ?? ''}${routePath}`;
}
