import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import DocumentRegistryArtifact from './abi/DocumentRegistry.json';

export interface RegisterResult {
  txHash: string;
  blockNumber: number;
}

export interface VerifyResult {
  documentHash: string;
  storageRef: string;
  registeredBy: string;
  timestamp: number;
  exists: boolean;
}

const HASH_REGEX = /^[a-fA-F0-9]{64}$/;

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly contract: Contract;

  constructor(config: ConfigService) {
    const rpcUrl = config.get<string>('RPC_URL');
    const privateKey = config.get<string>('PRIVATE_KEY');
    const address = config.get<string>('CONTRACT_ADDRESS');
    if (!rpcUrl) throw new Error('RPC_URL ausente na configuração.');
    if (!privateKey) throw new Error('PRIVATE_KEY ausente na configuração.');
    if (!address) throw new Error('CONTRACT_ADDRESS ausente na configuração.');

    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
    this.contract = new Contract(
      address,
      DocumentRegistryArtifact.abi,
      signer,
    );
  }

  async registerDocument(
    hash: string,
    storageRef: string,
  ): Promise<RegisterResult> {
    const bytes32 = this.toBytes32(hash);
    try {
      const tx = await this.contract.registerDocument(bytes32, storageRef);
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async verifyDocument(hash: string): Promise<VerifyResult> {
    const bytes32 = this.toBytes32(hash);
    const record = await this.contract.verifyDocument(bytes32);
    return {
      documentHash: record.documentHash,
      storageRef: record.storageRef,
      registeredBy: record.registeredBy,
      timestamp: Number(record.timestamp),
      exists: record.exists,
    };
  }

  async isRegistered(hash: string): Promise<boolean> {
    return this.contract.isRegistered(this.toBytes32(hash));
  }

  private toBytes32(hash: string): string {
    const clean = hash.startsWith('0x') ? hash.slice(2) : hash;
    if (!HASH_REGEX.test(clean)) {
      throw new BadRequestException(
        'hash inválido: exige 64 chars hex SHA-256.',
      );
    }
    return '0x' + clean.toLowerCase();
  }

  private mapError(err: unknown): Error {
    if (err instanceof BadRequestException) return err;
    const revertName = (
      err as { revert?: { name?: string } }
    ).revert?.name;

    if (revertName === 'DocumentAlreadyRegistered') {
      return new ConflictException('Documento já registrado on-chain.');
    }
    if (revertName === 'InvalidHash') {
      return new BadRequestException('Hash inválido rejeitado pelo contrato.');
    }
    if (revertName === 'EmptyStorageRef') {
      return new BadRequestException('StorageRef vazio rejeitado pelo contrato.');
    }

    const message =
      err instanceof Error ? err.message : 'Erro blockchain desconhecido';
    this.logger.error(`Falha na tx blockchain: ${message}`);
    return new InternalServerErrorException(
      `Falha ao comunicar com blockchain: ${message}`,
    );
  }
}
