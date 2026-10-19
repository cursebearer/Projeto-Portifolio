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

const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS =
  process.env.NODE_ENV === 'test' ? [0, 0, 0] : [0, 500, 1500];

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly providers: JsonRpcProvider[];
  private readonly contracts: Contract[];
  private readonly _signerAddress: string;
  private activeIndex = 0;

  constructor(config: ConfigService) {
    const rpcUrl = config.get<string>('RPC_URL');
    const fallbackRaw = config.get<string>('RPC_FALLBACK_URLS') ?? '';
    const privateKey = config.get<string>('PRIVATE_KEY');
    const address = config.get<string>('CONTRACT_ADDRESS');
    if (!rpcUrl) throw new Error('RPC_URL ausente na configuração.');
    if (!privateKey) throw new Error('PRIVATE_KEY ausente na configuração.');
    if (!address) throw new Error('CONTRACT_ADDRESS ausente na configuração.');

    const urls = [
      rpcUrl,
      ...fallbackRaw
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
    ];

    this.providers = urls.map((u) => new JsonRpcProvider(u));
    this.contracts = this.providers.map(
      (p) =>
        new Contract(
          address,
          DocumentRegistryArtifact.abi,
          new Wallet(privateKey, p),
        ),
    );
    this._signerAddress = new Wallet(privateKey).address;

    if (urls.length > 1) {
      this.logger.log(
        `BlockchainService: ${urls.length} RPCs configurados (primário + ${urls.length - 1} fallback).`,
      );
    }
  }

  get signerAddress(): string {
    return this._signerAddress;
  }

  private get contract(): Contract {
    return this.contracts[this.activeIndex];
  }

  private get provider(): JsonRpcProvider {
    return this.providers[this.activeIndex];
  }

  async registerDocument(
    hash: string,
    storageRef: string,
  ): Promise<RegisterResult> {
    const bytes32 = this.toBytes32(hash);
    await this.assertSufficientBalance();
    try {
      // tx submission é retriable (sem efeito colateral até tx aceita)
      // tx.wait NÃO é retriable (tx já broadcasted; retry duplicaria)
      const tx = await this.retryWithFallback(
        (c) => c.registerDocument(bytes32, storageRef),
        'registerDocument',
      );
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
    return this.retryWithFallback(
      () =>
        this.withTimeout(
          this.provider.getBlockNumber(),
          HEALTH_TIMEOUT_MS,
          'getBlockNumber',
        ),
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

  private async retryWithFallback<T>(
    op: (contract: Contract) => Promise<T>,
    label: string,
  ): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
      if (RETRY_BACKOFF_MS[attempt]) {
        await this.sleep(RETRY_BACKOFF_MS[attempt]);
      }
      try {
        return await op(this.contract);
      } catch (err) {
        lastErr = err;
        if (!this.isRetriable(err)) {
          throw err;
        }
        const previousIdx = this.activeIndex;
        this.rotateProvider();
        this.logger.warn(
          `${label}: tentativa ${attempt + 1}/${RETRY_MAX_ATTEMPTS} falhou (RPC #${previousIdx}). ${
            previousIdx === this.activeIndex
              ? 'Sem fallback disponível, aguardando backoff.'
              : `Rotacionando para RPC #${this.activeIndex}.`
          } Erro: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private rotateProvider(): void {
    if (this.providers.length <= 1) return;
    this.activeIndex = (this.activeIndex + 1) % this.providers.length;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isRetriable(err: unknown): boolean {
    // Reverts do contrato: nunca retriable (bug de regra, não falha de infra)
    const revertName = (err as { revert?: { name?: string } }).revert?.name;
    if (revertName) return false;

    // Nossas próprias validações: nunca retriable
    if (err instanceof BadRequestException) return false;
    if (err instanceof ConflictException) return false;

    // Erros de rede/RPC: retriable
    return true;
  }

  async verifyDocument(hash: string): Promise<VerifyResult> {
    const bytes32 = this.toBytes32(hash);
    const record = await this.retryWithFallback(
      (c) => c.verifyDocument(bytes32) as Promise<{
        documentHash: string;
        storageRef: string;
        registeredBy: string;
        timestamp: bigint;
        exists: boolean;
      }>,
      'verifyDocument',
    );
    return {
      documentHash: record.documentHash,
      storageRef: record.storageRef,
      registeredBy: record.registeredBy,
      timestamp: Number(record.timestamp),
      exists: record.exists,
    };
  }

  async isRegistered(hash: string): Promise<boolean> {
    const bytes32 = this.toBytes32(hash);
    return this.retryWithFallback(
      (c) => c.isRegistered(bytes32) as Promise<boolean>,
      'isRegistered',
    );
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
