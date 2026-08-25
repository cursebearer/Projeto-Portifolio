import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CommonModule } from './common/common.module';
import { CryptoModule } from './crypto/crypto.module';
import { DocumentsModule } from './documents/documents.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRES_IN: Joi.string().default('15m'),
        ENCRYPTION_KEY: Joi.string().length(64).required(),
        RPC_URL: Joi.string().uri().required(),
        PRIVATE_KEY: Joi.string().required(),
        CONTRACT_ADDRESS: Joi.string().required(),
        NETWORK: Joi.string().default('sepolia'),
        STORAGE_TYPE: Joi.string().valid('LOCAL', 'IPFS').default('LOCAL'),
        UPLOAD_DIR: Joi.string().default('./uploads'),
        MAX_FILE_SIZE_MB: Joi.number().default(50),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        LOG_LEVEL: Joi.string()
          .valid('verbose', 'debug', 'log', 'warn', 'error', 'fatal')
          .default('log'),
        THROTTLE_TTL_SECONDS: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(100),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl:
            config.get<number>('THROTTLE_TTL_SECONDS', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    PrismaModule,
    CommonModule,
    CryptoModule,
    StorageModule,
    BlockchainModule,
    AuditModule,
    AuthModule,
    DocumentsModule,
    VerificationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
