import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../auth/auth.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let apiKeys: { create: jest.Mock; list: jest.Mock; revoke: jest.Mock };

  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    apiKeys = {
      create: jest.fn().mockResolvedValue({ id: 'k1', key: 'dc_live_x' }),
      list: jest.fn().mockResolvedValue([]),
      revoke: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [{ provide: ApiKeysService, useValue: apiKeys }],
    }).compile();

    controller = module.get(ApiKeysController);
  });

  it('POST /api-keys cria a chave para o usuário logado', async () => {
    const result = await controller.create(user, { name: 'ERP' });

    expect(apiKeys.create).toHaveBeenCalledWith('u1', 'ERP');
    expect(result.key).toBe('dc_live_x');
  });

  it('GET /api-keys lista as chaves do usuário logado', async () => {
    await controller.list(user);
    expect(apiKeys.list).toHaveBeenCalledWith('u1');
  });

  it('DELETE /api-keys/:id revoga a chave do usuário logado', async () => {
    await controller.revoke(user, 'k1');
    expect(apiKeys.revoke).toHaveBeenCalledWith('u1', 'k1');
  });
});
