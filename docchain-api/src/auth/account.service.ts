import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import type { IStorageService } from '../storage/storage.interface';
import type { AuthenticatedUser } from './auth.service';

export interface AccountExport {
  exportedAt: string;
  user: AuthenticatedUser;
  documents: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    hash: string;
    status: string;
    txHash: string | null;
    network: string | null;
    blockNumber: number | null;
    uploadedAt: Date;
    confirmedAt: Date | null;
    deletedAt: Date | null;
    previousDocumentId: string | null;
  }>;
  shares: Array<{
    documentId: string;
    sharedWithEmail: string;
    message: string | null;
    sentAt: Date;
  }>;
}

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async updateName(userId: string, name: string): Promise<AuthenticatedUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: USER_PUBLIC_FIELDS,
    });
  }

  async exportData(userId: string): Promise<AccountExport> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_FIELDS,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const [documents, shares] = await Promise.all([
      this.prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'asc' },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          hash: true,
          status: true,
          txHash: true,
          network: true,
          blockNumber: true,
          uploadedAt: true,
          confirmedAt: true,
          deletedAt: true,
          previousDocumentId: true,
        },
      }),
      this.prisma.documentShare.findMany({
        where: { sharedByUserId: userId },
        orderBy: { sentAt: 'asc' },
        select: {
          documentId: true,
          sharedWithEmail: true,
          message: true,
          sentAt: true,
        },
      }),
    ]);

    return { exportedAt: new Date().toISOString(), user, documents, shares };
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // 403 (não 401) para o frontend não tratar senha errada como sessão expirada.
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new ForbiddenException('Senha incorreta.');
    }

    const documents = await this.prisma.document.findMany({
      where: { userId },
      select: { id: true, hash: true, deletedAt: true },
    });

    for (const doc of documents.filter((d) => !d.deletedAt)) {
      try {
        await this.storage.delete(doc.hash);
      } catch (err) {
        this.logger.warn(
          `Exclusão de conta: falha ao apagar ${doc.hash}.enc: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    const documentIds = documents.map((d) => d.id);
    await this.prisma.$transaction([
      this.prisma.documentShare.deleteMany({
        where: {
          OR: [{ sharedByUserId: userId }, { documentId: { in: documentIds } }],
        },
      }),
      this.prisma.verificationAttempt.updateMany({
        where: { OR: [{ userId }, { documentId: { in: documentIds } }] },
        data: { userId: null, documentId: null },
      }),
      this.prisma.auditLog.updateMany({
        where: {
          OR: [
            { userId },
            { metadata: { path: ['email'], equals: user.email } },
          ],
        },
        data: { userId: null, metadata: Prisma.DbNull },
      }),
      this.prisma.document.updateMany({
        where: { userId },
        data: { previousDocumentId: null },
      }),
      this.prisma.document.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
