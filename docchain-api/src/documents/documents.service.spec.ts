import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, DocumentStatus } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    document: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let crypto: {
    hashFile: jest.Mock;
    encrypt: jest.Mock;
    decrypt: jest.Mock;
    serializePayload: jest.Mock;
    deserializePayload: jest.Mock;
  };
  let storage: {
    save: jest.Mock;
    retrieve: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };
  let blockchain: {
    registerDocument: jest.Mock;
    signerAddress: string;
  };
  let audit: { log: jest.Mock };

  const userId = 'user-1';
  const hash = 'a'.repeat(64);
  const file = {
    buffer: Buffer.from('conteúdo'),
    originalname: 'doc.pdf',
    mimetype: 'application/pdf',
    size: 8,
  } as unknown as Express.Multer.File;

  const baseDoc = {
    id: 'doc-1',
    userId,
    fileName: 'doc.pdf',
    mimeType: 'application/pdf',
    fileSize: 8,
    hash,
    hashAlgorithm: 'SHA-256',
    storageType: 'LOCAL',
    storageRef: null,
    encryptionIv: null,
    encryptionAuthTag: null,
    txHash: null,
    network: 'sepolia',
    walletAddress: null,
    blockNumber: null,
    status: DocumentStatus.PROCESSING,
    errorMessage: null,
    uploadedAt: new Date(),
    confirmedAt: null,
    updatedAt: new Date(),
    deletedAt: null,
    previousDocumentId: null,
  };

  beforeEach(async () => {
    prisma = {
      document: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    crypto = {
      hashFile: jest.fn().mockReturnValue(hash),
      encrypt: jest.fn().mockReturnValue({
        iv: Buffer.from('iv-bytes'),
        authTag: Buffer.from('tag-bytes'),
        ciphertext: Buffer.from('ct'),
      }),
      decrypt: jest.fn().mockReturnValue(Buffer.from('conteúdo')),
      serializePayload: jest.fn().mockReturnValue(Buffer.from('serialized')),
      deserializePayload: jest.fn().mockReturnValue({
        iv: Buffer.from('iv'),
        authTag: Buffer.from('tag'),
        ciphertext: Buffer.from('ct'),
      }),
    };
    storage = {
      save: jest.fn().mockResolvedValue(`local:${hash}.enc`),
      retrieve: jest.fn().mockResolvedValue(Buffer.from('serialized')),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(true),
    };
    blockchain = {
      registerDocument: jest.fn().mockResolvedValue({
        txHash: '0xabc',
        blockNumber: 42,
      }),
      signerAddress: '0xWallet',
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CryptoService, useValue: crypto },
        { provide: STORAGE_SERVICE, useValue: storage },
        { provide: BlockchainService, useValue: blockchain },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('create — fluxo completo', () => {
    beforeEach(() => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(baseDoc);
      prisma.document.update
        .mockResolvedValueOnce({ ...baseDoc, storageRef: `local:${hash}.enc` })
        .mockResolvedValueOnce({
          ...baseDoc,
          status: DocumentStatus.CONFIRMED,
          txHash: '0xabc',
          blockNumber: 42,
          walletAddress: '0xWallet',
          confirmedAt: new Date(),
        });
    });

    it('executa hash → encrypt → save → register → CONFIRMED', async () => {
      const result = await service.create(userId, file);

      expect(crypto.hashFile).toHaveBeenCalledWith(file.buffer);
      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { hash },
      });
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          hash,
          fileName: 'doc.pdf',
          mimeType: 'application/pdf',
          fileSize: 8,
          status: DocumentStatus.PROCESSING,
        }),
      });
      expect(crypto.encrypt).toHaveBeenCalledWith(file.buffer);
      expect(crypto.serializePayload).toHaveBeenCalled();
      expect(storage.save).toHaveBeenCalledWith(
        hash,
        Buffer.from('serialized'),
      );
      expect(blockchain.registerDocument).toHaveBeenCalledWith(
        hash,
        `local:${hash}.enc`,
      );
      expect(prisma.document.update).toHaveBeenNthCalledWith(2, {
        where: { id: baseDoc.id },
        data: expect.objectContaining({
          status: DocumentStatus.CONFIRMED,
          txHash: '0xabc',
          blockNumber: 42,
          walletAddress: '0xWallet',
          confirmedAt: expect.any(Date),
        }),
      });
      expect(result.status).toBe(DocumentStatus.CONFIRMED);
    });

    it('registra AuditLog UPLOAD após CONFIRMED', async () => {
      await service.create(userId, file);

      expect(audit.log).toHaveBeenCalledWith({
        action: AuditAction.UPLOAD,
        userId,
        resourceType: 'Document',
        resourceId: baseDoc.id,
        metadata: expect.objectContaining({
          hash,
          fileName: 'doc.pdf',
          txHash: '0xabc',
          blockNumber: 42,
        }),
      });
    });

    it('persiste iv/authTag em base64', async () => {
      await service.create(userId, file);

      expect(prisma.document.update).toHaveBeenNthCalledWith(1, {
        where: { id: baseDoc.id },
        data: expect.objectContaining({
          storageRef: `local:${hash}.enc`,
          encryptionIv: Buffer.from('iv-bytes').toString('base64'),
          encryptionAuthTag: Buffer.from('tag-bytes').toString('base64'),
        }),
      });
    });
  });

  describe('create — validações e erros', () => {
    it('rejeita arquivo ausente (BadRequest)', async () => {
      await expect(
        service.create(userId, undefined as unknown as Express.Multer.File),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita hash duplicado (Conflict)', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...baseDoc,
        deletedAt: null,
      });

      await expect(service.create(userId, file)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.document.create).not.toHaveBeenCalled();
      expect(blockchain.registerDocument).not.toHaveBeenCalled();
    });

    it('permite re-upload se hash pertence a doc soft-deleted', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...baseDoc,
        deletedAt: new Date(),
      });
      prisma.document.create.mockResolvedValue(baseDoc);
      prisma.document.update.mockResolvedValue(baseDoc);

      await expect(service.create(userId, file)).resolves.toBeDefined();
    });

    it('rollback em falha do blockchain → apaga file + status FAILED + rethrow', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(baseDoc);
      prisma.document.update.mockResolvedValue(baseDoc);
      blockchain.registerDocument.mockRejectedValue(
        new Error('gas insuficiente'),
      );

      await expect(service.create(userId, file)).rejects.toThrow(
        'gas insuficiente',
      );

      expect(storage.delete).toHaveBeenCalledWith(hash);
      expect(prisma.document.update).toHaveBeenLastCalledWith({
        where: { id: baseDoc.id },
        data: expect.objectContaining({
          status: DocumentStatus.FAILED,
          errorMessage: 'gas insuficiente',
        }),
      });
    });

    it('rollback em falha do storage → status FAILED', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(baseDoc);
      prisma.document.update.mockResolvedValue(baseDoc);
      storage.save.mockRejectedValue(new Error('disk full'));

      await expect(service.create(userId, file)).rejects.toThrow('disk full');

      expect(prisma.document.update).toHaveBeenLastCalledWith({
        where: { id: baseDoc.id },
        data: expect.objectContaining({
          status: DocumentStatus.FAILED,
          errorMessage: 'disk full',
        }),
      });
    });

    it('ignora falha em storage.delete durante rollback', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(baseDoc);
      prisma.document.update.mockResolvedValue(baseDoc);
      blockchain.registerDocument.mockRejectedValue(new Error('boom'));
      storage.delete.mockRejectedValue(new Error('delete fail'));

      await expect(service.create(userId, file)).rejects.toThrow('boom');
      expect(prisma.document.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: DocumentStatus.FAILED }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('paginação default: page 1 limit 20', async () => {
      prisma.document.findMany.mockResolvedValue([baseDoc]);
      prisma.document.count.mockResolvedValue(1);

      const result = await service.findAll(userId, {});

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { userId, deletedAt: null },
        orderBy: { uploadedAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ items: [baseDoc], total: 1, page: 1, limit: 20 });
    });

    it('filtro por status aplica no where', async () => {
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      await service.findAll(userId, { status: DocumentStatus.CONFIRMED });

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DocumentStatus.CONFIRMED,
          }),
        }),
      );
    });

    it('paginação custom aplica skip correto', async () => {
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(50);

      await service.findAll(userId, { page: 3, limit: 10 });

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('retorna doc quando encontra + userId bate', async () => {
      prisma.document.findFirst.mockResolvedValue(baseDoc);

      const result = await service.findOne(userId, 'doc-1');

      expect(prisma.document.findFirst).toHaveBeenCalledWith({
        where: { id: 'doc-1', userId, deletedAt: null },
      });
      expect(result).toBe(baseDoc);
    });

    it('404 quando não encontra (evita vazar existência)', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'doc-outro'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('404 quando doc pertence a outro user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'doc-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove — soft delete', () => {
    it('marca deletedAt + apaga arquivo + AuditLog DELETE', async () => {
      prisma.document.findFirst.mockResolvedValue(baseDoc);
      prisma.document.update.mockResolvedValue({
        ...baseDoc,
        deletedAt: new Date(),
      });

      await service.remove(userId, 'doc-1');

      expect(storage.delete).toHaveBeenCalledWith(hash);
      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith({
        action: AuditAction.DELETE,
        userId,
        resourceType: 'Document',
        resourceId: 'doc-1',
        metadata: { hash, fileName: 'doc.pdf' },
      });
    });

    it('ignora erro de storage.delete (idempotente)', async () => {
      prisma.document.findFirst.mockResolvedValue(baseDoc);
      storage.delete.mockRejectedValue(new Error('not found'));
      prisma.document.update.mockResolvedValue(baseDoc);

      await expect(service.remove(userId, 'doc-1')).resolves.toBeUndefined();
      expect(prisma.document.update).toHaveBeenCalled();
    });

    it('404 se doc não pertence ao user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(userId, 'ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('retrieve → deserialize → decrypt → devolve buffer + metadata + AuditLog DOWNLOAD', async () => {
      prisma.document.findFirst.mockResolvedValue({
        ...baseDoc,
        status: DocumentStatus.CONFIRMED,
      });

      const result = await service.download(userId, 'doc-1');

      expect(storage.retrieve).toHaveBeenCalledWith(hash);
      expect(crypto.deserializePayload).toHaveBeenCalled();
      expect(crypto.decrypt).toHaveBeenCalled();
      expect(result.buffer.toString()).toBe('conteúdo');
      expect(result.fileName).toBe('doc.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(audit.log).toHaveBeenCalledWith({
        action: AuditAction.DOWNLOAD,
        userId,
        resourceType: 'Document',
        resourceId: 'doc-1',
        metadata: { hash, fileName: 'doc.pdf' },
      });
    });

    it('rejeita download se status != CONFIRMED', async () => {
      prisma.document.findFirst.mockResolvedValue({
        ...baseDoc,
        status: DocumentStatus.PROCESSING,
      });

      await expect(
        service.download(userId, 'doc-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.retrieve).not.toHaveBeenCalled();
    });

    it('404 se doc não pertence ao user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.download(userId, 'ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createVersion (Fase 2.9)', () => {
    const motherId = 'doc-mother-1';
    const motherDoc = {
      ...baseDoc,
      id: motherId,
      hash: 'b'.repeat(64),
      status: DocumentStatus.CONFIRMED,
    };
    const newHash = 'c'.repeat(64);
    const versionDoc = {
      ...baseDoc,
      id: 'doc-v2',
      hash: newHash,
      previousDocumentId: motherId,
    };

    beforeEach(() => {
      crypto.hashFile.mockReturnValue(newHash);
      prisma.document.findFirst.mockResolvedValue(motherDoc);
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(versionDoc);
      prisma.document.update
        .mockResolvedValueOnce({
          ...versionDoc,
          storageRef: `local:${newHash}.enc`,
        })
        .mockResolvedValueOnce({
          ...versionDoc,
          status: DocumentStatus.CONFIRMED,
          txHash: '0xdef',
          blockNumber: 100,
        });
    });

    it('cria versão vinculada à mãe (previousDocumentId setado)', async () => {
      const result = await service.createVersion(userId, motherId, file);

      expect(prisma.document.findFirst).toHaveBeenCalledWith({
        where: { id: motherId, userId, deletedAt: null },
      });
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousDocumentId: motherId,
          hash: newHash,
        }),
      });
      expect(result.previousDocumentId).toBe(motherId);
    });

    it('audit log inclui versionOf no metadata', async () => {
      await service.createVersion(userId, motherId, file);

      expect(audit.log).toHaveBeenCalledWith({
        action: AuditAction.UPLOAD,
        userId,
        resourceType: 'Document',
        resourceId: versionDoc.id,
        metadata: expect.objectContaining({
          versionOf: motherId,
          hash: newHash,
        }),
      });
    });

    it('404 se documento-mãe não pertence ao user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.createVersion(userId, motherId, file),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it('404 se documento-mãe está soft-deleted', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.createVersion(userId, motherId, file),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('409 se hash da nova versão já existe on-chain (arquivo idêntico)', async () => {
      prisma.document.findUnique.mockResolvedValue({
        ...baseDoc,
        hash: newHash,
        deletedAt: null,
      });

      await expect(
        service.createVersion(userId, motherId, file),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(blockchain.registerDocument).not.toHaveBeenCalled();
    });
  });

  describe('findVersions (Fase 2.9)', () => {
    const rootDoc = { ...baseDoc, id: 'root', previousDocumentId: null };
    const v2Doc = {
      ...baseDoc,
      id: 'v2',
      hash: 'd'.repeat(64),
      previousDocumentId: 'root',
    };
    const v3Doc = {
      ...baseDoc,
      id: 'v3',
      hash: 'e'.repeat(64),
      previousDocumentId: 'v2',
    };

    it('retorna timeline completa quando chamado a partir da raiz', async () => {
      prisma.document.findFirst.mockResolvedValue(rootDoc);
      prisma.document.findMany
        .mockResolvedValueOnce([v2Doc])
        .mockResolvedValueOnce([v3Doc])
        .mockResolvedValueOnce([]);

      const result = await service.findVersions(userId, 'root');

      expect(result.root).toBe(rootDoc);
      expect(result.versions).toEqual([v2Doc, v3Doc]);
      expect(result.totalVersions).toBe(3);
    });

    it('resolve raiz quando chamado a partir de versão intermediária', async () => {
      prisma.document.findFirst.mockResolvedValue(v2Doc);
      prisma.document.findUnique.mockResolvedValueOnce(rootDoc);
      prisma.document.findMany
        .mockResolvedValueOnce([v2Doc])
        .mockResolvedValueOnce([v3Doc])
        .mockResolvedValueOnce([]);

      const result = await service.findVersions(userId, 'v2');

      expect(prisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 'root' },
      });
      expect(result.root).toEqual(rootDoc);
      expect(result.totalVersions).toBe(3);
    });

    it('doc único sem versões → totalVersions 1, versions vazio', async () => {
      prisma.document.findFirst.mockResolvedValue(rootDoc);
      prisma.document.findMany.mockResolvedValueOnce([]);

      const result = await service.findVersions(userId, 'root');

      expect(result.totalVersions).toBe(1);
      expect(result.versions).toEqual([]);
    });

    it('404 se doc não pertence ao user', async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        service.findVersions(userId, 'root'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
