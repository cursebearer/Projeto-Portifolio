import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Document, DocumentStatus, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit/audit-log.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type { IStorageService } from '../storage/storage.interface';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { ListDocumentsQueryDto } from './dto/list-documents.query.dto';
import { PaginatedDocuments, VersionTimeline } from './documents.types';

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
    return this.performRegistration(userId, file, null);
  }

  async createVersion(
    userId: string,
    previousDocumentId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    const mother = await this.prisma.document.findFirst({
      where: { id: previousDocumentId, userId, deletedAt: null },
    });
    if (!mother) {
      throw new NotFoundException('Documento-mãe não encontrado.');
    }
    return this.performRegistration(userId, file, previousDocumentId);
  }

  async findAll(
    userId: string,
    query: ListDocumentsQueryDto,
  ): Promise<PaginatedDocuments> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      userId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.includeVersions ? {} : { previousDocumentId: null }),
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

    const counts = await this.countDescendantsForMany(items.map((i) => i.id));
    const withCount = items.map((item) => ({
      ...item,
      versionCount: counts.get(item.id) ?? 0,
    }));

    return { items: withCount, total, page, limit };
  }

  private async countDescendantsForMany(
    ids: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>(ids.map((id) => [id, 0]));
    if (ids.length === 0) return counts;

    let frontier = new Map<string, string>(ids.map((id) => [id, id]));
    while (frontier.size > 0) {
      const parentIds = Array.from(frontier.keys());
      const children = await this.prisma.document.findMany({
        where: {
          previousDocumentId: { in: parentIds },
          deletedAt: null,
        },
        select: { id: true, previousDocumentId: true },
      });
      const next = new Map<string, string>();
      for (const child of children) {
        if (!child.previousDocumentId) continue;
        const ancestor = frontier.get(child.previousDocumentId);
        if (!ancestor) continue;
        counts.set(ancestor, (counts.get(ancestor) ?? 0) + 1);
        next.set(child.id, ancestor);
      }
      frontier = next;
    }
    return counts;
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

  async findVersions(userId: string, id: string): Promise<VersionTimeline> {
    const doc = await this.findOne(userId, id);
    const root = await this.resolveRoot(doc);
    const descendants = await this.collectDescendants(root.id);
    return {
      root,
      versions: descendants,
      totalVersions: 1 + descendants.length,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const doc = await this.findOne(userId, id);

    try {
      await this.storage.delete(doc.hash);
    } catch (err) {
      this.logger.warn(
        `Delete: falha ao apagar ${doc.hash}.enc: ${
          err instanceof Error ? err.message : String(err)
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

  private async performRegistration(
    userId: string,
    file: Express.Multer.File,
    previousDocumentId: string | null,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório.');
    }

    const hash = this.crypto.hashFile(file.buffer);

    const existing = await this.prisma.document.findUnique({
      where: { hash },
    });
    // RN07: documento FAILED do próprio usuário pode ser reenviado (reaproveita a linha, hash é único).
    const isRetry =
      existing?.status === DocumentStatus.FAILED && existing.userId === userId;
    if (existing && !isRetry) {
      throw new ConflictException(
        this.buildDuplicateError(existing, existing.userId === userId),
      );
    }

    const fields = {
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: DocumentStatus.PROCESSING,
      previousDocumentId:
        previousDocumentId ?? existing?.previousDocumentId ?? null,
    };
    const document = isRetry
      ? await this.prisma.document.update({
          where: { id: existing.id },
          data: { ...fields, errorMessage: null, deletedAt: null },
        })
      : await this.prisma.document.create({
          data: { ...fields, userId, hash },
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

      const metadata: Prisma.InputJsonValue = {
        hash,
        fileName: file.originalname,
        txHash,
        blockNumber,
        ...(previousDocumentId ? { versionOf: previousDocumentId } : {}),
      };
      await this.audit.log({
        action: AuditAction.UPLOAD,
        userId,
        resourceType: 'Document',
        resourceId: confirmed.id,
        metadata,
      });

      return confirmed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      try {
        await this.storage.delete(hash);
      } catch (delErr) {
        this.logger.warn(
          `Rollback: falha ao apagar ${hash}.enc: ${
            delErr instanceof Error ? delErr.message : String(delErr)
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

  private buildDuplicateError(
    existing: Document,
    isOwner: boolean,
  ): Record<string, unknown> {
    const registeredAt =
      existing.confirmedAt?.toISOString() ?? existing.uploadedAt.toISOString();
    const dateBr = new Date(registeredAt).toLocaleDateString('pt-BR');
    const walletShort = existing.walletAddress
      ? `${existing.walletAddress.slice(0, 6)}…${existing.walletAddress.slice(-4)}`
      : 'carteira oficial do DocChain';
    const message = isOwner
      ? `Você já registrou este arquivo em ${dateBr}. Para criar uma nova versão modifique o conteúdo antes de enviar.`
      : `Este arquivo já foi registrado em ${dateBr} pela ${walletShort}. Você pode verificar a autenticidade sem precisar re-registrar.`;
    return {
      statusCode: 409,
      message,
      error: 'DOCUMENT_ALREADY_REGISTERED',
      hash: existing.hash,
      registeredAt,
      walletAddress: existing.walletAddress,
      verifyUrl: `/verify/${existing.hash}`,
      isOwner,
    };
  }

  private async resolveRoot(doc: Document): Promise<Document> {
    let current = doc;
    while (current.previousDocumentId) {
      const parent = await this.prisma.document.findUnique({
        where: { id: current.previousDocumentId },
      });
      if (!parent) break;
      current = parent;
    }
    return current;
  }

  private async collectDescendants(rootId: string): Promise<Document[]> {
    const all: Document[] = [];
    const queue = [rootId];
    while (queue.length) {
      const parentId = queue.shift() as string;
      const children = await this.prisma.document.findMany({
        where: { previousDocumentId: parentId },
        orderBy: { uploadedAt: 'asc' },
      });
      all.push(...children);
      queue.push(...children.map((c) => c.id));
    }
    return all;
  }
}
