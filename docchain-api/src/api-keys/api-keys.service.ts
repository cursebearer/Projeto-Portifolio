import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { AuditLogService } from '../audit/audit-log.service';
import type { AuthenticatedUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

export const API_KEY_PREFIX = 'dc_live_';
export const MAX_ACTIVE_KEYS = 5;
// Parte visível na listagem: "dc_live_" + 4 caracteres.
const VISIBLE_PREFIX_LENGTH = API_KEY_PREFIX.length + 4;

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface CreatedApiKey extends ApiKeySummary {
  // A chave completa só existe nesta resposta; o banco guarda apenas o hash.
  key: string;
}

export interface ApiKeyPrincipal {
  user: AuthenticatedUser;
  apiKeyId: string;
}

const SUMMARY_SELECT = {
  id: true,
  name: true,
  prefix: true,
  createdAt: true,
  lastUsedAt: true,
} as const;

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async create(userId: string, name: string): Promise<CreatedApiKey> {
    const active = await this.prisma.apiKey.count({
      where: { userId, revokedAt: null },
    });
    if (active >= MAX_ACTIVE_KEYS) {
      throw new ConflictException(
        `Limite de ${MAX_ACTIVE_KEYS} chaves ativas atingido. Revogue uma chave para criar outra.`,
      );
    }

    // 24 bytes aleatórios = 192 bits: impossível de adivinhar por força bruta.
    const key = API_KEY_PREFIX + randomBytes(24).toString('base64url');
    const created = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        prefix: key.slice(0, VISIBLE_PREFIX_LENGTH),
        keyHash: hashApiKey(key),
      },
      select: SUMMARY_SELECT,
    });

    await this.audit.log({
      action: AuditAction.API_KEY_CREATE,
      userId,
      resourceType: 'ApiKey',
      resourceId: created.id,
      metadata: { name, prefix: created.prefix },
    });

    return { ...created, key };
  }

  list(userId: string): Promise<ApiKeySummary[]> {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: SUMMARY_SELECT,
    });
  }

  async revoke(userId: string, id: string): Promise<void> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId, revokedAt: null },
      select: { id: true, prefix: true },
    });
    if (!key) {
      throw new NotFoundException('Chave não encontrada.');
    }

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      action: AuditAction.API_KEY_REVOKE,
      userId,
      resourceType: 'ApiKey',
      resourceId: key.id,
      metadata: { prefix: key.prefix },
    });
  }

  // Usado pelo guard: troca a chave recebida no header pelo usuário dono dela.
  async validate(rawKey: string): Promise<ApiKeyPrincipal> {
    if (!rawKey.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException('API key inválida.');
    }

    const found = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(rawKey) },
      include: {
        user: {
          select: { id: true, email: true, name: true, createdAt: true },
        },
      },
    });
    if (!found || found.revokedAt) {
      throw new UnauthorizedException('API key inválida ou revogada.');
    }

    await this.prisma.apiKey.update({
      where: { id: found.id },
      data: { lastUsedAt: new Date() },
    });

    return { user: found.user, apiKeyId: found.id };
  }
}
