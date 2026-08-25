import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const healthService = { check: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('delega ao HealthService.check', async () => {
    const payload = {
      status: 'ok' as const,
      checks: {
        database: { status: 'up' as const },
        blockchain: { status: 'up' as const, blockNumber: 42 },
      },
    };
    healthService.check.mockResolvedValue(payload);
    await expect(controller.check()).resolves.toBe(payload);
    expect(healthService.check).toHaveBeenCalledTimes(1);
  });
});
