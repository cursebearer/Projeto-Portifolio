import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
  }
  return { PrismaClient: MockPrismaClient };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('onModuleInit chama $connect', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy chama $disconnect', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('propaga erro de $connect', async () => {
    (service.$connect as jest.Mock).mockRejectedValueOnce(
      new Error('connection refused'),
    );
    await expect(service.onModuleInit()).rejects.toThrow('connection refused');
  });

  it('propaga erro de $disconnect', async () => {
    (service.$disconnect as jest.Mock).mockRejectedValueOnce(
      new Error('shutdown fail'),
    );
    await expect(service.onModuleDestroy()).rejects.toThrow('shutdown fail');
  });
});
