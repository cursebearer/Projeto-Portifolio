import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Document, DocumentStatus } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type { IStorageService } from '../storage/storage.interface';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { ListDocumentsQueryDto } from './dto/list-documents.query.dto';
import { PaginatedDocuments } from './documents.types';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly blockchain: BlockchainService,
    private readonly audit: AuditLogService,
  ) {}

  async create(userId: string, file: Express.Multer.File): Promise<Document> {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório.');
    }

    const hash = this.crypto.hashFile(file.buffer);

    const existing = await this.prisma.document.findUnique({
      where: { hash },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Documento com este hash já registrado.');
    }

    const document = await this.prisma.document.create({
      data: {
        userId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        hash,
        status: DocumentStatus.PROCESSING,
      },
    });

    try {
      const encrypted = this.crypto.encrypt(file.buffer);
      const serialized = this.crypto.serializePayload(encrypted);
      const storageRef = await this.storage.save(hash, serialized);

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          storageRef,
          encryptionIv: encrypted.iv.toString('base64'),
          encryptionAuthTag: encrypted.authTag.toString('base64'),
        },
      });

      const { txHash, blockNumber } = await this.blockchain.registerDocument(
        hash,
        storageRef,
      );

      const confirmed = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.CONFIRMED,
          txHash,
          blockNumber,
          walletAddress: this.blockchain.signerAddress,
          confirmedAt: new Date(),
        },
      });

      await this.audit.log({
        action: AuditAction.UPLOAD,
        userId,
        resourceType: 'Document',
        resourceId: confirmed.id,
        metadata: {
          hash,
          fileName: file.originalname,
          txHash,
          blockNumber,
        },
      });

      return confirmed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      try {
        await this.storage.delete(hash);
      } catch (delErr) {
        this.logger.warn(
          `Rollback: falha ao apagar ${hash}.enc: ${
            delErr instanceof Error ? delErr.message : delErr
          }`,
        );
      }
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: message,
        },
      });
      throw err;
    }
  }

  async findAll(
    userId: string,
    query: ListDocumentsQueryDto,
  ): Promise<PaginatedDocuments> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<Document> {
    const doc = await this.prisma.document.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado.');
    }
    return doc;
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.findOne(userId, id);

    try {
      await this.storage.delete(doc.hash);
    } catch (err) {
      this.logger.warn(
        `Delete: falha ao apagar ${doc.hash}.enc: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      action: AuditAction.DELETE,
      userId,
      resourceType: 'Document',
      resourceId: doc.id,
      metadata: { hash: doc.hash, fileName: doc.fileName },
    });
  }

  async download(
    userId: string,
    id: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const doc = await this.findOne(userId, id);
    if (doc.status !== DocumentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Documento não confirmado on-chain — download indisponível.',
      );
    }
    const serialized = await this.storage.retrieve(doc.hash);
    const payload = this.crypto.deserializePayload(serialized);
    const buffer = this.crypto.decrypt(payload);

    await this.audit.log({
      action: AuditAction.DOWNLOAD,
      userId,
      resourceType: 'Document',
      resourceId: doc.id,
      metadata: { hash: doc.hash, fileName: doc.fileName },
    });

    return { buffer, fileName: doc.fileName, mimeType: doc.mimeType };
  }
}
