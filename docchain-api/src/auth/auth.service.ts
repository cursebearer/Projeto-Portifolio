import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface LoginResult {
  accessToken: string;
  expiresInSeconds: number;
  user: AuthenticatedUser;
}

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthenticatedUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name ?? null,
      },
    });

    await this.audit.log({
      action: AuditAction.REGISTER,
      userId: user.id,
      resourceType: 'User',
      resourceId: user.id,
    });

    return this.toAuthenticatedUser(user);
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      await this.audit.log({
        action: AuditAction.LOGIN,
        userId: null,
        metadata: { success: false, email: dto.email, reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await this.audit.log({
        action: AuditAction.LOGIN,
        userId: user.id,
        metadata: { success: false, reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn } as unknown as import('@nestjs/jwt').JwtSignOptions,
    );

    await this.audit.log({
      action: AuditAction.LOGIN,
      userId: user.id,
      metadata: { success: true },
    });

    return {
      accessToken,
      expiresInSeconds: this.parseExpiresInSeconds(expiresIn),
      user: this.toAuthenticatedUser(user),
    };
  }

  async findById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toAuthenticatedUser(user) : null;
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  private parseExpiresInSeconds(expiresIn: string): number {
    const match = /^(\d+)([smhd])?$/.exec(expiresIn);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2] ?? 's';
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}
