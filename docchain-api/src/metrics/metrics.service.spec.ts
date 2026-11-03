import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsService', () => {
  const groupBy = jest.fn();
  const prisma = { document: { groupBy } } as unknown as PrismaService;
  let service: MetricsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MetricsService(prisma);
  });

  it('expõe métricas default com prefixo docchain_', async () => {
    groupBy.mockResolvedValue([]);
    const output = await service.render();
    expect(output).toContain('docchain_process_cpu_user_seconds_total');
  });

  it('registra duração e contagem de requisições por rota', async () => {
    groupBy.mockResolvedValue([]);
    service.observeRequest('GET', '/documents/:id', 200, 0.12);
    const output = await service.render();
    expect(output).toContain(
      'docchain_http_requests_total{method="GET",route="/documents/:id",status_code="200"} 1',
    );
    expect(output).toContain('docchain_http_request_duration_seconds_bucket');
  });

  it('gauge de documentos preenche todos os status, inclusive zerados', async () => {
    groupBy.mockResolvedValue([
      { status: 'CONFIRMED', _count: { _all: 7 } },
      { status: 'FAILED', _count: { _all: 1 } },
    ]);
    const output = await service.render();
    expect(output).toContain('docchain_documents{status="CONFIRMED"} 7');
    expect(output).toContain('docchain_documents{status="FAILED"} 1');
    expect(output).toContain('docchain_documents{status="PENDING"} 0');
    expect(groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
  });

  it('usa o content type do registry', () => {
    expect(service.contentType).toContain('text/plain');
  });
});
