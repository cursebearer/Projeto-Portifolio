import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { BlockchainService } from './blockchain.service';

jest.mock('ethers', () => {
  const contractInstance = {
    registerDocument: jest.fn(),
    verifyDocument: jest.fn(),
    isRegistered: jest.fn(),
  };
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({ __provider: true })),
    Wallet: jest.fn().mockImplementation(() => ({ __signer: true })),
    Contract: jest.fn().mockImplementation(() => contractInstance),
    __contractInstance: contractInstance,
  };
});

const contractMock = (jest.requireMock('ethers') as { __contractInstance: {
  registerDocument: jest.Mock;
  verifyDocument: jest.Mock;
  isRegistered: jest.Mock;
} }).__contractInstance;

const validHash =
  'a'.repeat(64);
const validHashPrefixed = '0x' + validHash;

describe('BlockchainService', () => {
  let service: BlockchainService;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    (JsonRpcProvider as unknown as jest.Mock).mockClear();
    (Wallet as unknown as jest.Mock).mockClear();
    (Contract as unknown as jest.Mock).mockClear();
    contractMock.registerDocument.mockReset();
    contractMock.verifyDocument.mockReset();
    contractMock.isRegistered.mockReset();

    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          RPC_URL: 'https://sepolia.example/rpc',
          PRIVATE_KEY: '0x' + 'b'.repeat(64),
          CONTRACT_ADDRESS: '0x' + 'c'.repeat(40),
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  describe('constructor', () => {
    it('instancia Provider, Wallet e Contract com envs corretas', () => {
      expect(JsonRpcProvider).toHaveBeenCalledWith(
        'https://sepolia.example/rpc',
      );
      expect(Wallet).toHaveBeenCalledWith(
        '0x' + 'b'.repeat(64),
        expect.objectContaining({ __provider: true }),
      );
      expect(Contract).toHaveBeenCalledWith(
        '0x' + 'c'.repeat(40),
        expect.any(Array),
        expect.objectContaining({ __signer: true }),
      );
    });

    it.each(['RPC_URL', 'PRIVATE_KEY', 'CONTRACT_ADDRESS'])(
      'lança se %s ausente',
      async (missing) => {
        const badConfig = {
          get: jest.fn((key: string) =>
            key === missing
              ? undefined
              : key === 'RPC_URL'
                ? 'http://x'
                : key === 'PRIVATE_KEY'
                  ? '0x' + 'a'.repeat(64)
                  : '0x' + 'c'.repeat(40),
          ),
        };
        await expect(
          Test.createTestingModule({
            providers: [
              BlockchainService,
              { provide: ConfigService, useValue: badConfig },
            ],
          }).compile(),
        ).rejects.toThrow(new RegExp(missing));
      },
    );
  });

  describe('registerDocument', () => {
    it('envia tx e retorna { txHash, blockNumber }', async () => {
      const waitMock = jest.fn().mockResolvedValue({
        hash: '0xtxhash',
        blockNumber: 12345,
      });
      contractMock.registerDocument.mockResolvedValue({ wait: waitMock });

      const result = await service.registerDocument(
        validHash,
        'local:abc.enc',
      );

      expect(contractMock.registerDocument).toHaveBeenCalledWith(
        validHashPrefixed,
        'local:abc.enc',
      );
      expect(waitMock).toHaveBeenCalled();
      expect(result).toEqual({ txHash: '0xtxhash', blockNumber: 12345 });
    });

    it('aceita hash já prefixado com 0x', async () => {
      const waitMock = jest.fn().mockResolvedValue({
        hash: '0xtx',
        blockNumber: 1,
      });
      contractMock.registerDocument.mockResolvedValue({ wait: waitMock });

      await service.registerDocument(validHashPrefixed, 'ref');

      expect(contractMock.registerDocument).toHaveBeenCalledWith(
        validHashPrefixed,
        'ref',
      );
    });

    it('normaliza hash uppercase para lowercase', async () => {
      const waitMock = jest.fn().mockResolvedValue({
        hash: '0xtx',
        blockNumber: 1,
      });
      contractMock.registerDocument.mockResolvedValue({ wait: waitMock });

      await service.registerDocument('A'.repeat(64), 'ref');

      expect(contractMock.registerDocument).toHaveBeenCalledWith(
        '0x' + 'a'.repeat(64),
        'ref',
      );
    });

    it('rejeita hash inválido (regex) antes de chamar contrato', async () => {
      await expect(
        service.registerDocument('zz', 'ref'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(contractMock.registerDocument).not.toHaveBeenCalled();
    });

    it('mapeia DocumentAlreadyRegistered → ConflictException', async () => {
      contractMock.registerDocument.mockRejectedValue({
        revert: { name: 'DocumentAlreadyRegistered' },
      });

      await expect(
        service.registerDocument(validHash, 'ref'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('mapeia InvalidHash → BadRequestException', async () => {
      contractMock.registerDocument.mockRejectedValue({
        revert: { name: 'InvalidHash' },
      });

      await expect(
        service.registerDocument(validHash, 'ref'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('mapeia EmptyStorageRef → BadRequestException', async () => {
      contractMock.registerDocument.mockRejectedValue({
        revert: { name: 'EmptyStorageRef' },
      });

      await expect(
        service.registerDocument(validHash, 'ref'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('erro genérico → InternalServerErrorException', async () => {
      contractMock.registerDocument.mockRejectedValue(
        new Error('network timeout'),
      );

      await expect(
        service.registerDocument(validHash, 'ref'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('verifyDocument', () => {
    it('mapeia struct do contrato para VerifyResult', async () => {
      contractMock.verifyDocument.mockResolvedValue({
        documentHash: validHashPrefixed,
        storageRef: 'local:x.enc',
        registeredBy: '0xowner',
        timestamp: 1700000000n,
        exists: true,
      });

      const result = await service.verifyDocument(validHash);

      expect(contractMock.verifyDocument).toHaveBeenCalledWith(
        validHashPrefixed,
      );
      expect(result).toEqual({
        documentHash: validHashPrefixed,
        storageRef: 'local:x.enc',
        registeredBy: '0xowner',
        timestamp: 1700000000,
        exists: true,
      });
    });

    it('exists false quando struct zerada', async () => {
      contractMock.verifyDocument.mockResolvedValue({
        documentHash:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        storageRef: '',
        registeredBy: '0x0000000000000000000000000000000000000000',
        timestamp: 0n,
        exists: false,
      });

      const result = await service.verifyDocument(validHash);
      expect(result.exists).toBe(false);
    });

    it('rejeita hash inválido', async () => {
      await expect(service.verifyDocument('bad')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('isRegistered', () => {
    it('devolve bool do contrato', async () => {
      contractMock.isRegistered.mockResolvedValue(true);

      const result = await service.isRegistered(validHash);

      expect(contractMock.isRegistered).toHaveBeenCalledWith(
        validHashPrefixed,
      );
      expect(result).toBe(true);
    });

    it('rejeita hash inválido', async () => {
      await expect(service.isRegistered('bad')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
