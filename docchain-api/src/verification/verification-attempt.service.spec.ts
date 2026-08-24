import { Test, TestingModule } from '@nestjs/testing';
import { VerificationSource } from '@prisma/client';
import { RequestContextService } from '../common/request-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationAttemptService } from './verification-attempt.service';

describe('VerificationAttemptService', () => {
  let service: VerificationAttemptService;
  let prisma: { verificationAttempt: { create: jest.Mock } };
  let ctx: { get: jest.Mock };

  const hash = 'a'.repeat(64);

  beforeEach(async () => {
    prisma = {
      verificationAttempt: { create: jest.fn().mockResolvedValue({}) },
    };
    ctx = { get: jest.fn().mockReturnValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationAttemptService,
        { provide: PrismaService, useValue: prisma },
        { provide: RequestContextService, useValue: ctx },
      ],
    }).compile();

    service = module.get<VerificationAttemptService>(
      VerificationAttemptService,
    );
  });

  it('grava tentativa PUBLIC com ip + userAgent (userId null)', async () => {
    ctx.get.mockReturnValue({ ipAddress: '1.1.1.1', userAgent: 'ua' });

    await service.record({
      hash,
      found: true,
      source: VerificationSource.PUBLIC,
      documentId: 'doc-1',
    });

    expect(prisma.verificationAttempt.create).toHaveBeenCalledWith({
      data: {
        hash,
        found: true,
        source: VerificationSource.PUBLIC,
        documentId: 'doc-1',
        userId: null,
        ipAddress: '1.1.1.1',
        userAgent: 'ua',
      },
    });
  });

  it('grava tentativa PRIVATE com userId do contexto', async () => {
    ctx.get.mockReturnValue({ userId: 'u1' });

    await service.record({
      hash,
      found: false,
      source: VerificationSource.PRIVATE,
    });

    expect(prisma.verificationAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          source: VerificationSource.PRIVATE,
          found: false,
        }),
      }),
    );
  });

  it('userId explícito sobrescreve contexto', async () => {
    ctx.get.mockReturnValue({ userId: 'ctx' });

    await service.record({
      hash,
      found: true,
      source: VerificationSource.PRIVATE,
      userId: 'override',
    });

    expect(prisma.verificationAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'override' }),
      }),
    );
  });

  it('não lança se prisma falhar', async () => {
    prisma.verificationAttempt.create.mockRejectedValue(new Error('db'));

    await expect(
      service.record({
        hash,
        found: false,
        source: VerificationSource.PUBLIC,
      }),
    ).resolves.toBeUndefined();
  });
});
