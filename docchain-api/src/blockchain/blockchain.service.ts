import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
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
const TX_CONFIRMATIONS = 1;
const TX_WAIT_TIMEOUT_MS = 30_000; // RNF02: registro <30s
const HEALTH_TIMEOUT_MS = 5_000;
const LOW_BALANCE_WEI = 1_000_000_000_000_000n; // 0.001 ETH

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly provider: JsonRpcProvider;
  private readonly contract: Contract;
  private readonly _signerAddress: string;

  constructor(config: ConfigService) {
    const rpcUrl = config.get<string>('RPC_URL');
    const privateKey = config.get<string>('PRIVATE_KEY');
    const address = config.get<string>('CONTRACT_ADDRESS');
    if (!rpcUrl) throw new Error('RPC_URL ausente na configuração.');
    if (!privateKey) throw new Error('PRIVATE_KEY ausente na configuração.');
    if (!address) throw new Error('CONTRACT_ADDRESS ausente na configuração.');

    this.provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, this.provider);
    this._signerAddress = signer.address;
    this.contract = new Contract(
      address,
      DocumentRegistryArtifact.abi,
      signer,
    );
  }

  get signerAddress(): string {
    return this._signerAddress;
  }

  async registerDocument(
    hash: string,
    storageRef: string,
  ): Promise<RegisterResult> {
    const bytes32 = this.toBytes32(hash);
    await this.assertSufficientBalance();
    try {
      const tx = await this.contract.registerDocument(bytes32, storageRef);
      const receipt = await this.waitWithTimeout(tx);
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async getBlockNumber(): Promise<number> {
    return this.withTimeout(
      this.provider.getBlockNumber(),
      HEALTH_TIMEOUT_MS,
      'getBlockNumber',
    );
  }

  private async assertSufficientBalance(): Promise<void> {
    try {
      const balance = await this.provider.getBalance(this._signerAddress);
      if (balance < LOW_BALANCE_WEI) {
        this.logger.warn(
          `Saldo baixo no signer ${this._signerAddress}: ${balance} wei. Recarregue faucet para evitar falhas.`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Não foi possível checar saldo pré-transação: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async waitWithTimeout(tx: {
    wait: (confirmations?: number) => Promise<unknown>;
  }): Promise<{ hash: string; blockNumber: number }> {
    const receipt = (await this.withTimeout(
      tx.wait(TX_CONFIRMATIONS),
      TX_WAIT_TIMEOUT_MS,
      'tx.wait',
    )) as { hash: string; blockNumber: number };
    return receipt;
  }

  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new RequestTimeoutException(
            `Timeout ${ms}ms excedido em blockchain (${label}).`,
          ),
        );
      }, ms);
      promise.then(
        (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
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
    if (err instanceof RequestTimeoutException) return err;
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
