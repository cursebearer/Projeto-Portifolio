import { Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequestDuration = new Histogram({
    name: 'docchain_http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
    registers: [this.registry],
  });

  readonly httpRequestsTotal = new Counter({
    name: 'docchain_http_requests_total',
    help: 'Total de requisições HTTP',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  readonly documentsByStatus: Gauge;

  constructor(private readonly prisma: PrismaService) {
    collectDefaultMetrics({ register: this.registry, prefix: 'docchain_' });

    const prismaRef = this.prisma;
    this.documentsByStatus = new Gauge({
      name: 'docchain_documents',
      help: 'Documentos não removidos por status',
      labelNames: ['status'],
      registers: [this.registry],
      async collect() {
        const groups = await prismaRef.document.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: { _all: true },
        });
        for (const status of Object.values(DocumentStatus)) {
          const found = groups.find((g) => g.status === status);
          this.set({ status }, found?._count._all ?? 0);
        }
      },
    });
  }

  observeRequest(
    method: string,
    route: string,
    statusCode: number,
    seconds: number,
  ): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.httpRequestDuration.observe(labels, seconds);
    this.httpRequestsTotal.inc(labels);
  }

  async render(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
