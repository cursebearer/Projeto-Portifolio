import { Test, TestingModule } from '@nestjs/testing';
import { VerificationSource } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VerificationAttemptService } from './verification-attempt.service';
import { VerifyController } from './verify.controller';

describe('VerifyController', () => {
  let controller: VerifyController;
  let blockchain: { verifyDocument: jest.Mock };
  let attempts: { record: jest.Mock };

  const hash = 'a'.repeat(64);
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'r@r.com',
    name: 'R',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    blockchain = { verifyDocument: jest.fn() };
    attempts = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
      providers: [
        { provide: BlockchainService, useValue: blockchain },
        { provide: VerificationAttemptService, useValue: attempts },
      ],
    }).compile();

    controller = module.get<VerifyController>(VerifyController);
  });

  describe('POST /documents/verify (privado)', () => {
    it('consulta contrato + grava attempt PRIVATE com userId', async () => {
      blockchain.verifyDocument.mockResolvedValue({
        exists: true,
        documentHash: '0x' + hash,
        storageRef: 'local:x.enc',
        registeredBy: '0xowner',
        timestamp: 1700000000,
      });

      const result = await controller.verifyPrivate(user, { hash });

      expect(blockchain.verifyDocument).toHaveBeenCalledWith(hash);
      expect(attempts.record).toHaveBeenCalledWith({
        hash,
        found: true,
        source: VerificationSource.PRIVATE,
        userId: 'u1',
      });
      expect(result.exists).toBe(true);
    });

    it('grava attempt com found=false quando doc não existe', async () => {
      blockchain.verifyDocument.mockResolvedValue({
        exists: false,
        documentHash: '0x00',
        storageRef: '',
        registeredBy: '0x00',
        timestamp: 0,
      });

      await controller.verifyPrivate(user, { hash });

      expect(attempts.record).toHaveBeenCalledWith(
        expect.objectContaining({ found: false }),
      );
    });
  });

  describe('GET /verify/public/:hash', () => {
    it('consulta contrato + grava attempt PUBLIC com userId null', async () => {
      blockchain.verifyDocument.mockResolvedValue({
        exists: true,
        documentHash: '0x' + hash,
        storageRef: 'local:x.enc',
        registeredBy: '0xowner',
        timestamp: 1700000000,
      });

      const result = await controller.verifyPublic({ hash });

      expect(blockchain.verifyDocument).toHaveBeenCalledWith(hash);
      expect(attempts.record).toHaveBeenCalledWith({
        hash,
        found: true,
        source: VerificationSource.PUBLIC,
        userId: null,
      });
      expect(result.exists).toBe(true);
    });
  });
});
