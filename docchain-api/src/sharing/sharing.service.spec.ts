import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, DocumentStatus } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { CryptoService } from '../crypto/crypto.service';
import { MailerService } from '../mailer/mailer.service';
import { PdfService } from '../pdf/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { SharingService } from './sharing.service';

describe('SharingService', () => {
  let service: SharingService;
  let prisma: {
    document: { findFirst: jest.Mock };
    documentShare: { count: jest.Mock; create: jest.Mock };
  };
  let crypto: { deserializePayload: jest.Mock; decrypt: jest.Mock };
  let storage: { retrieve: jest.Mock };
  let pdf: { generateComprovante: jest.Mock };
  let mailer: { send: jest.Mock };
  let audit: { log: jest.Mock };

  const userId = 'user-1';
  const docId = 'doc-1';
  const confirmedDoc = {
    id: docId,
    userId,
    fileName: 'contrato.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    hash: 'a'.repeat(64),
    status: DocumentStatus.CONFIRMED,
    deletedAt: null,
    txHash: '0xabc',
    blockNumber: 42,
    walletAddress: '0xWallet',
    network: 'sepolia',
    storageRef: 'local:aaa.enc',
    user: { name: 'Rafael', email: 'rafa@docchain.dev' },
  };

  beforeEach(async () => {
    prisma = {
      document: { findFirst: jest.fn() },
      documentShare: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'share-1',
            sentAt: new Date(),
            verificationCount: 0,
            ...data,
          }),
        ),
      },
    };
    crypto = {
      deserializePayload: jest.fn().mockReturnValue({
        iv: Buffer.alloc(12),
        authTag: Buffer.alloc(16),
        ciphertext: Buffer.from('ct'),
      }),
      decrypt: jest.fn().mockReturnValue(Buffer.from('conteudo original')),
    };
    storage = {
      retrieve: jest.fn().mockResolvedValue(Buffer.from('serialized')),
    };
    pdf = {
      generateComprovante: jest.fn().mockResolvedValue(Buffer.from('%PDF-fake')),
    };
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    const config = {
      get: jest.fn((_key: string, def?: unknown) => def),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: prisma },
        { provide: CryptoService, useValue: crypto },
        { provide: STORAGE_SERVICE, useValue: storage },
        { provide: PdfService, useValue: pdf },
        { provide: MailerService, useValue: mailer },
        { provide: AuditLogService, useValue: audit },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  const dto = { email: 'juiz@tribunal.gov.br', message: 'confidencial' };

  describe('share — fluxo completo', () => {
    beforeEach(() => {
      prisma.document.findFirst.mockResolvedValue(confirmedDoc);
    });

    it('executa retrieve → decrypt → pdf → mailer → create share → audit', async () => {
      const result = await service.share(userId, docId, dto);

      expect(storage.retrieve).toHaveBeenCalledWith(confirmedDoc.hash);
      expect(crypto.decrypt).toHaveBeenCalled();
      expect(pdf.generateComprovante).toHaveBeenCalledWith(
        confirmedDoc,
        { name: 'Rafael', email: 'rafa@docchain.dev' },
      );
      expect(mailer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: dto.email,
          attachments: expect.arrayContaining([
            expect.objectContaining({ filename: 'contrato.pdf' }),
            expect.objectContaining({
              filename: expect.stringMatching(/^Comprovante-DocChain-/),
              contentType: 'application/pdf',
            }),
          ]),
        }),
      );
      expect(prisma.documentShare.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: docId,
          sharedByUserId: userId,
          sharedWithEmail: dto.email,
          message: 'confidencial',
          comprovanteHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SHARE,
          userId,
          resourceType: 'Document',
          resourceId: docId,
        }),
      );
      expect(result.id).toBe('share-1');
    });

    it('comprovanteHash é SHA-256 hex do PDF gerado (32 bytes = 64 hex chars)', async () => {
      pdf.generateComprovante.mockResolvedValue(Buffer.from('%PDF-conteudo'));
      await service.share(userId, docId, dto);
      const call = prisma.documentShare.create.mock.calls[0][0];
      expect(call.data.comprovanteHash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('share — validações', () => {
    it('404 se documento não encontrado', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(service.share(userId, docId, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('404 se documento pertence a outro user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(service.share(userId, docId, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400 se status != CONFIRMED', async () => {
      prisma.document.findFirst.mockResolvedValue({
        ...confirmedDoc,
        status: DocumentStatus.PROCESSING,
      });

      await expect(service.share(userId, docId, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mailer.send).not.toHaveBeenCalled();
    });

    it('429 se rate limit atingido (5 shares/h)', async () => {
      prisma.documentShare.count.mockResolvedValue(5);

      await expect(service.share(userId, docId, dto)).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(prisma.document.findFirst).not.toHaveBeenCalled();
    });

    it('propaga falha do mailer sem gravar DocumentShare', async () => {
      prisma.document.findFirst.mockResolvedValue(confirmedDoc);
      mailer.send.mockRejectedValue(new Error('SMTP down'));

      await expect(service.share(userId, docId, dto)).rejects.toThrow(
        'SMTP down',
      );
      expect(prisma.documentShare.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
