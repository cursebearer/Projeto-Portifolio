import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthenticatedUser } from '../auth/auth.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documents: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    download: jest.Mock;
  };

  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    documents = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      download: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: documents }],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('POST /documents delega para service.create', async () => {
    const file = { originalname: 'a.pdf' } as Express.Multer.File;
    documents.create.mockResolvedValue({ id: 'd1' });

    await controller.upload(user, file);

    expect(documents.create).toHaveBeenCalledWith('u1', file);
  });

  it('GET /documents delega para service.findAll', async () => {
    documents.findAll.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await controller.list(user, { page: 2, limit: 10 });

    expect(documents.findAll).toHaveBeenCalledWith('u1', {
      page: 2,
      limit: 10,
    });
  });

  it('GET /documents/:id delega para service.findOne', async () => {
    documents.findOne.mockResolvedValue({ id: 'd1' });

    await controller.detail(user, 'd1');

    expect(documents.findOne).toHaveBeenCalledWith('u1', 'd1');
  });

  it('DELETE /documents/:id delega para service.remove', async () => {
    documents.remove.mockResolvedValue(undefined);

    await controller.remove(user, 'd1');

    expect(documents.remove).toHaveBeenCalledWith('u1', 'd1');
  });

  describe('GET /documents/:id/download', () => {
    it('seta headers e envia buffer', async () => {
      documents.download.mockResolvedValue({
        buffer: Buffer.from('arquivo original'),
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
      });
      const setHeader = jest.fn();
      const send = jest.fn();
      const res = { setHeader, send } as unknown as Response;

      await controller.download(user, 'd1', res);

      expect(documents.download).toHaveBeenCalledWith('u1', 'd1');
      expect(setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="doc.pdf"',
      );
      expect(send).toHaveBeenCalledWith(Buffer.from('arquivo original'));
    });

    it('encoda nomes com caractere especial no Content-Disposition', async () => {
      documents.download.mockResolvedValue({
        buffer: Buffer.from(''),
        fileName: 'nota fiscal.pdf',
        mimeType: 'application/pdf',
      });
      const setHeader = jest.fn();
      const send = jest.fn();
      const res = { setHeader, send } as unknown as Response;

      await controller.download(user, 'd1', res);

      expect(setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('nota%20fiscal.pdf'),
      );
    });
  });
});
