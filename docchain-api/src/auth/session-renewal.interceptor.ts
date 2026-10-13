import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { from, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.service';
import { ACCESS_TOKEN_COOKIE, setAccessTokenCookie } from './session-cookie';

// Sessão deslizante: requisição autenticada com o token além da metade da validade recebe um novo.
@Injectable()
export class SessionRenewalInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionRenewalInterceptor.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    // Renova antes do handler: se o handler apagar o cookie (logout), o Set-Cookie dele vem depois e prevalece.
    return from(this.renewIfNeeded(http.getRequest(), http.getResponse())).pipe(
      switchMap(() => next.handle()),
    );
  }

  private async renewIfNeeded(req: Request, res: Response): Promise<void> {
    const user = req.user as AuthenticatedUser | undefined;
    const token = (req.cookies as Record<string, string> | undefined)?.[
      ACCESS_TOKEN_COOKIE
    ];
    if (!user || !token) return;

    const payload = this.jwt.decode<{ iat?: number; exp?: number } | null>(
      token,
    );
    if (!payload?.exp || !payload.iat) return;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const halfLife = (payload.exp - payload.iat) / 2;
    if (payload.exp - nowSeconds > halfLife) return;

    try {
      const { accessToken, expiresInSeconds } =
        await this.auth.issueAccessToken(user);
      setAccessTokenCookie(
        res,
        accessToken,
        expiresInSeconds,
        this.config.get<string>('NODE_ENV') === 'production',
      );
    } catch (err) {
      this.logger.warn(
        `Falha ao renovar sessão: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
