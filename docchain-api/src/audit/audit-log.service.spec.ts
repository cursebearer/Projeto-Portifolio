import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction } from '@prisma/client';
import { RequestContextService } from '../common/request-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: { auditLog: { create: jest.Mock } };
  let ctx: { get: jest.Mock };

  beforeEach(async () => {
    prisma = { auditLog: { create: jest.fn().mockResolvedValue({}) } };
    ctx = { get: jest.fn().mockReturnValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: prisma },
        { provide: RequestContextService, useValue: ctx },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('grava linha com ip + userAgent do contexto', async () => {
    ctx.get.mockReturnValue({
      ipAddress: '1.2.3.4',
      userAgent: 'jest',
      userId: 'ctx-user',
    });

    await service.log({
      action: AuditAction.UPLOAD,
      resourceType: 'Document',
      resourceId: 'doc-1',
      metadata: { hash: 'x' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: AuditAction.UPLOAD,
        userId: 'ctx-user',
        resourceType: 'Document',
        resourceId: 'doc-1',
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
        metadata: { hash: 'x' },
      },
    });
  });

  it('userId explícito sobrescreve contexto', async () => {
    ctx.get.mockReturnValue({ userId: 'ctx-user' });

    await service.log({
      action: AuditAction.DELETE,
      userId: 'override-user',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'override-user' }),
      }),
    );
  });

  it('userId null explícito registra ação anônima', async () => {
    ctx.get.mockReturnValue({ userId: 'ctx-user' });

    await service.log({
      action: AuditAction.VERIFY_PUBLIC,
      userId: null,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: null }),
      }),
    );
  });

  it('não lança erro se prisma falhar (só loga warn)', async () => {
    prisma.auditLog.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.log({ action: AuditAction.LOGIN }),
    ).resolves.toBeUndefined();
  });
});
