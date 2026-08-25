import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';

export type CheckStatus = 'up' | 'down';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: { status: CheckStatus; detail?: string };
    blockchain: {
      status: CheckStatus;
      blockNumber?: number;
      detail?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  async check(): Promise<HealthResponse> {
    const [database, blockchain] = await Promise.all([
      this.checkDatabase(),
      this.checkBlockchain(),
    ]);
    const response: HealthResponse = {
      status:
        database.status === 'up' && blockchain.status === 'up'
          ? 'ok'
          : 'degraded',
      checks: { database, blockchain },
    };
    if (response.status === 'degraded') {
      throw new ServiceUnavailableException(response);
    }
    return response;
  }

  private async checkDatabase(): Promise<HealthResponse['checks']['database']> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`DB health falhou: ${detail}`);
      return { status: 'down', detail };
    }
  }

  private async checkBlockchain(): Promise<
    HealthResponse['checks']['blockchain']
  > {
    try {
      const blockNumber = await this.blockchain.getBlockNumber();
      return { status: 'up', blockNumber };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Blockchain health falhou: ${detail}`);
      return { status: 'down', detail };
    }
  }
}
