import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ALLOW_API_KEY } from './allow-api-key.decorator';
import { ApiKeysService } from './api-keys.service';

export const API_KEY_HEADER = 'x-api-key';

export type RequestWithApiKey = Request & {
  user?: AuthenticatedUser;
  apiKeyId?: string;
};

// Com header X-API-Key: valida a chave (só em rotas marcadas com @AllowApiKey).
// Sem o header: segue o login normal por cookie (JwtAuthGuard).
@Injectable()
export class JwtOrApiKeyGuard extends JwtAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeys: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithApiKey>();
    const rawKey = req.headers[API_KEY_HEADER];

    if (typeof rawKey !== 'string' || rawKey === '') {
      return (await super.canActivate(context)) as boolean;
    }

    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed) {
      throw new ForbiddenException(
        'Esta rota não aceita API key. Use o login da plataforma.',
      );
    }

    const { user, apiKeyId } = await this.apiKeys.validate(rawKey);
    req.user = user;
    req.apiKeyId = apiKeyId;
    return true;
  }
}
