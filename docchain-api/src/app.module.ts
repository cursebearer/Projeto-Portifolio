import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
