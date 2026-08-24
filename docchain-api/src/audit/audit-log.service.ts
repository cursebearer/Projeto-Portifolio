import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { RequestContextService } from '../common/request-context.service';
import { PrismaService } from '../prisma/prisma.service';

export interface LogOptions {
  action: AuditAction;
  userId?: string | null;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async log(opts: LogOptions): Promise<void> {
    const { ipAddress, userAgent, userId: ctxUserId } = this.ctx.get();
    try {
      const userId =
        opts.userId !== undefined ? opts.userId : (ctxUserId ?? null);
      await this.prisma.auditLog.create({
        data: {
          action: opts.action,
          userId,
          resourceType: opts.resourceType,
          resourceId: opts.resourceId,
          ipAddress,
          userAgent,
          metadata: opts.metadata,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao gravar AuditLog (${opts.action}): ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }
}
