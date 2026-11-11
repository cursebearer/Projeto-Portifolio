import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { JwtOrApiKeyGuard } from './jwt-or-api-key.guard';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, JwtOrApiKeyGuard],
  exports: [ApiKeysService, JwtOrApiKeyGuard],
})
export class ApiKeysModule {}
