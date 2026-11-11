import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiKeySummary,
  ApiKeysService,
  CreatedApiKey,
} from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

// Gestão das chaves só com login (cookie): uma API key não consegue criar nem revogar chaves.
@ApiTags('api-keys')
@ApiCookieAuth('access_token')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ): Promise<CreatedApiKey> {
    return this.apiKeys.create(user.id, dto.name);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<ApiKeySummary[]> {
    return this.apiKeys.list(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.apiKeys.revoke(user.id, id);
  }
}
