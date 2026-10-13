import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuditAction } from '@prisma/client';
import type { Response } from 'express';
import { AuditLogService } from '../audit/audit-log.service';
import { AccountService } from './account.service';
import type { AccountExport } from './account.service';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { DeleteAccountDto, UpdateMeDto } from './dto/account.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const ACCESS_TOKEN_COOKIE = 'access_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
    private readonly account: AccountService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<AuthenticatedUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.authService.login(dto);
    this.setAccessTokenCookie(res, result.accessToken, result.expiresInSeconds);
    return { user: result.user };
  }

  @Post('logout')
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    this.clearAccessTokenCookie(res);
    await this.audit.log({ action: AuditAction.LOGOUT, userId: user.id });
  }

  @Get('me')
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Patch('me')
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ): Promise<AuthenticatedUser> {
    return this.account.updateName(user.id, dto.name);
  }

  @Get('me/export')
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  exportMe(@CurrentUser() user: AuthenticatedUser): Promise<AccountExport> {
    return this.account.exportData(user.id);
  }

  @Delete('me')
  @ApiCookieAuth('access_token')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.account.deleteAccount(user.id, dto.password);
    this.clearAccessTokenCookie(res);
  }

  private setAccessTokenCookie(
    res: Response,
    token: string,
    maxAgeSeconds: number,
  ): void {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    });
  }

  private clearAccessTokenCookie(res: Response): void {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
}
