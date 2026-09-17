import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const prisma = { $queryRaw: jest.fn() };
  const blockchain = { getBlockNumber: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlockchainService, useValue: blockchain },
      ],
    }).compile();
    service = module.get<HealthService>(HealthService);
  });

  it('retorna ok quando db e blockchain sobem', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    blockchain.getBlockNumber.mockResolvedValueOnce(9_876_543);

    const res = await service.check();

    expect(res.status).toBe('ok');
    expect(res.checks.database.status).toBe('up');
    expect(res.checks.blockchain.status).toBe('up');
    expect(res.checks.blockchain.blockNumber).toBe(9_876_543);
  });

  it('lança ServiceUnavailable quando db falha', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    blockchain.getBlockNumber.mockResolvedValueOnce(1);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('lança ServiceUnavailable quando blockchain falha', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    blockchain.getBlockNumber.mockRejectedValueOnce(new Error('timeout'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('degrada quando ambos falham (payload no exception response)', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    blockchain.getBlockNumber.mockRejectedValueOnce(new Error('rpc down'));

    await expect(service.check()).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 'degraded',
        checks: expect.objectContaining({
          database: expect.objectContaining({ status: 'down' }),
          blockchain: expect.objectContaining({ status: 'down' }),
        }),
      }),
    });
  });
});
