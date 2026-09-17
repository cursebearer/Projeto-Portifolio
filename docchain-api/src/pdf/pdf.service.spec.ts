import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Document, DocumentStatus } from '@prisma/client';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const config = {
      get: jest.fn((key: string, def?: unknown) => {
        const values: Record<string, unknown> = {
          NETWORK: 'sepolia',
          VERIFY_PUBLIC_BASE_URL: 'https://docchain.dev/verify/public',
        };
        return values[key] ?? def;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get<PdfService>(PdfService);
  });

  const buildDoc = (overrides: Partial<Document> = {}): Document => ({
    id: 'doc-1',
    userId: 'u-1',
    fileName: 'contrato.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    hash: 'a'.repeat(64),
    hashAlgorithm: 'SHA-256',
    storageType: 'LOCAL',
    storageRef: 'local:aaa.enc',
    encryptionIv: 'iv',
    encryptionAuthTag: 'tag',
    txHash: '0xabc',
    network: 'sepolia',
    walletAddress: '0xWallet',
    blockNumber: 12345,
    status: DocumentStatus.CONFIRMED,
    errorMessage: null,
    uploadedAt: new Date('2026-08-25T15:00:00Z'),
    confirmedAt: new Date('2026-08-25T15:00:14Z'),
    updatedAt: new Date('2026-08-25T15:00:14Z'),
    deletedAt: null,
    previousDocumentId: null,
    ...overrides,
  });

  it('gera Buffer PDF válido (assinatura %PDF-)', async () => {
    const doc = buildDoc();
    const emitter = { name: 'Rafael', email: 'rafa@docchain.dev' };

    const buffer = await service.generateComprovante(doc, emitter);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('funciona mesmo sem txHash (documento em PROCESSING não deveria chegar aqui mas robusto)', async () => {
    const doc = buildDoc({ txHash: null, blockNumber: null });
    const emitter = { name: null, email: 'x@x.com' };

    const buffer = await service.generateComprovante(doc, emitter);
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
  });
});
