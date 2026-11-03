import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  const metrics = {
    render: jest.fn().mockResolvedValue('docchain_up 1'),
    contentType: 'text/plain; version=0.0.4',
  } as unknown as MetricsService;

  function makeRes() {
    return { setHeader: jest.fn(), send: jest.fn() } as unknown as Response & {
      setHeader: jest.Mock;
      send: jest.Mock;
    };
  }

  function makeController(token: string) {
    const config = { get: jest.fn().mockReturnValue(token) } as unknown as ConfigService;
    return new MetricsController(metrics, config);
  }

  it('sem METRICS_TOKEN responde aberto', async () => {
    const res = makeRes();
    await makeController('').scrape(undefined, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', metrics.contentType);
    expect(res.send).toHaveBeenCalledWith('docchain_up 1');
  });

  it('com METRICS_TOKEN exige Bearer correto', async () => {
    const controller = makeController('segredo');
    await expect(controller.scrape(undefined, makeRes())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      controller.scrape('Bearer errado', makeRes()),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const res = makeRes();
    await controller.scrape('Bearer segredo', res);
    expect(res.send).toHaveBeenCalled();
  });
});
