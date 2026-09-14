import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, DocumentShare, DocumentStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { AuditLogService } from '../audit/audit-log.service';
import { CryptoService } from '../crypto/crypto.service';
import { MailerService } from '../mailer/mailer.service';
import { PdfService } from '../pdf/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import type { IStorageService } from '../storage/storage.interface';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import { ShareDocumentDto } from './dto/share-document.dto';

const DEFAULT_RATE_LIMIT = 5;

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);
  private readonly rateLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly pdf: PdfService,
    private readonly mailer: MailerService,
    private readonly audit: AuditLogService,
    config: ConfigService,
  ) {
    this.rateLimit = config.get<number>(
      'SHARE_RATE_LIMIT_PER_HOUR',
      DEFAULT_RATE_LIMIT,
    );
  }

  async share(
    userId: string,
    documentId: string,
    dto: ShareDocumentDto,
  ): Promise<DocumentShare> {
    await this.assertRateLimit(userId);

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!document) {
      throw new NotFoundException('Documento não encontrado.');
    }
    if (document.status !== DocumentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Documento não está confirmado on-chain — compartilhamento indisponível.',
      );
    }

    const serialized = await this.storage.retrieve(document.hash);
    const payload = this.crypto.deserializePayload(serialized);
    const originalBuffer = this.crypto.decrypt(payload);

    const comprovantePdf = await this.pdf.generateComprovante(document, {
      name: document.user.name,
      email: document.user.email,
    });
    const comprovanteHash = createHash('sha256')
      .update(comprovantePdf)
      .digest('hex');

    await this.mailer.send({
      to: dto.email,
      subject: `DocChain — Registro do documento ${document.fileName}`,
      text: this.buildEmailText(document.fileName, dto.message),
      attachments: [
        {
          filename: document.fileName,
          content: originalBuffer,
          contentType: document.mimeType,
        },
        {
          filename: `Comprovante-DocChain-${document.hash.slice(0, 8)}.pdf`,
          content: comprovantePdf,
          contentType: 'application/pdf',
        },
      ],
    });

    const share = await this.prisma.documentShare.create({
      data: {
        documentId: document.id,
        sharedByUserId: userId,
        sharedWithEmail: dto.email,
        message: dto.message,
        comprovanteHash,
      },
    });

    await this.audit.log({
      action: AuditAction.SHARE,
      userId,
      resourceType: 'Document',
      resourceId: document.id,
      metadata: {
        email: dto.email,
        hash: document.hash,
        comprovanteHash,
        shareId: share.id,
      },
    });

    return share;
  }

  private async assertRateLimit(userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.prisma.documentShare.count({
      where: { sharedByUserId: userId, sentAt: { gte: oneHourAgo } },
    });
    if (recent >= this.rateLimit) {
      throw new HttpException(
        `Rate limit: ${this.rateLimit} compartilhamentos por hora.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private buildEmailText(fileName: string, message?: string): string {
    const lines = [
      `Você recebeu o documento "${fileName}" pela plataforma DocChain.`,
      '',
      'Estão anexos:',
      '  1. O documento original',
      '  2. Um comprovante em PDF com hash SHA-256, transação blockchain e QR de verificação',
      '',
      'Para verificar a autenticidade sem depender do DocChain:',
      '  1. Calcule o SHA-256 do documento anexo (comandos no comprovante)',
      '  2. Compare com o hash impresso no comprovante',
      '  3. (Opcional) Escaneie o QR ou acesse o link do Etherscan para conferência on-chain',
    ];
    if (message) {
      lines.push('', 'Mensagem do remetente:', message);
    }
    return lines.join('\n');
  }
}
