import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../auth/auth.service';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

describe('SharingController', () => {
  let controller: SharingController;
  const sharing = { share: jest.fn() };
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharingController],
      providers: [{ provide: SharingService, useValue: sharing }],
    }).compile();
    controller = module.get<SharingController>(SharingController);
  });

  it('POST /documents/:id/share delega para service.share', async () => {
    sharing.share.mockResolvedValue({ id: 'share-1' });
    const dto = { email: 'j@j.com', message: 'oi' };

    const result = await controller.share(user, 'doc-1', dto);

    expect(sharing.share).toHaveBeenCalledWith('u1', 'doc-1', dto);
    expect(result).toEqual({ id: 'share-1' });
  });
});
