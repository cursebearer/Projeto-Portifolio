import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { getDocumentStats } from './documents';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }));

describe('getDocumentStats', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('deriva "em andamento" do total menos confirmados e falhos', async () => {
    vi.mocked(api.get).mockImplementation(async (_url, config) => {
      const status = (config?.params as { status?: string } | undefined)?.status;
      const total = status === 'CONFIRMED' ? 5 : status === 'FAILED' ? 2 : 8;
      return { data: { items: [], total, page: 1, limit: 1 } };
    });

    await expect(getDocumentStats()).resolves.toEqual({ total: 8, confirmed: 5, failed: 2, pending: 1 });
  });

  it('stats consultam com includeVersions=true (contadores incluem versões)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 1 },
    });

    await getDocumentStats();

    for (const call of vi.mocked(api.get).mock.calls) {
      const params = call[1]?.params as { includeVersions?: boolean };
      expect(params.includeVersions).toBe(true);
    }
  });
});
