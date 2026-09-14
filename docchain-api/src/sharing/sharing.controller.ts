import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DocumentShare } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShareDocumentDto } from './dto/share-document.dto';
import { SharingService } from './sharing.service';

@ApiTags('sharing')
@ApiCookieAuth('access_token')
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Post(':id/share')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() dto: ShareDocumentDto,
  ): Promise<DocumentShare> {
    return this.sharing.share(user.id, documentId, dto);
  }
}
