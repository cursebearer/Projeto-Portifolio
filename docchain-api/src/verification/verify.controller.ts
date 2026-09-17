import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VerificationSource } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockchainService, VerifyResult } from '../blockchain/blockchain.service';
import { VerifyHashDto } from './dto/verify-hash.dto';
import { VerificationAttemptService } from './verification-attempt.service';

@ApiTags('verification')
@Controller()
export class VerifyController {
  constructor(
    private readonly blockchain: BlockchainService,
    private readonly attempts: VerificationAttemptService,
  ) {}

  @Post('documents/verify')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  async verifyPrivate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyHashDto,
  ): Promise<VerifyResult> {
    const result = await this.blockchain.verifyDocument(dto.hash);
    await this.attempts.record({
      hash: dto.hash,
      found: result.exists,
      source: VerificationSource.PRIVATE,
      userId: user.id,
    });
    return result;
  }

  @Get('verify/public/:hash')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async verifyPublic(@Param() params: VerifyHashDto): Promise<VerifyResult> {
    const result = await this.blockchain.verifyDocument(params.hash);
    await this.attempts.record({
      hash: params.hash,
      found: result.exists,
      source: VerificationSource.PUBLIC,
      userId: null,
    });
    return result;
  }
}
