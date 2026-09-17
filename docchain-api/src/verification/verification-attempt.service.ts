import { Injectable, Logger } from '@nestjs/common';
import { VerificationSource } from '@prisma/client';
import { RequestContextService } from '../common/request-context.service';
import { PrismaService } from '../prisma/prisma.service';

export interface RecordOptions {
  hash: string;
  found: boolean;
  source: VerificationSource;
  documentId?: string;
  userId?: string | null;
}

@Injectable()
export class VerificationAttemptService {
  private readonly logger = new Logger(VerificationAttemptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async record(opts: RecordOptions): Promise<void> {
    const { ipAddress, userAgent, userId: ctxUserId } = this.ctx.get();
    try {
      const userId =
        opts.userId !== undefined ? opts.userId : (ctxUserId ?? null);
      await this.prisma.verificationAttempt.create({
        data: {
          hash: opts.hash,
          found: opts.found,
          source: opts.source,
          documentId: opts.documentId,
          userId,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao gravar VerificationAttempt (${opts.source}): ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }
}
