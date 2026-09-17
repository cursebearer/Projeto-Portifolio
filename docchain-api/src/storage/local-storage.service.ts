import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { IStorageService } from './storage.interface';

const HASH_REGEX = /^[a-f0-9]{64}$/;

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadDir: string;

  constructor(config: ConfigService) {
    const dir = config.get<string>('UPLOAD_DIR');
    if (!dir) {
      throw new Error('UPLOAD_DIR ausente na configuração.');
    }
    this.uploadDir = resolve(dir);
  }

  async save(hash: string, buffer: Buffer): Promise<string> {
    this.assertValidHash(hash);
    await this.ensureDir();
    await writeFile(this.pathFor(hash), buffer);
    return `local:${hash}.enc`;
  }

  async retrieve(hash: string): Promise<Buffer> {
    this.assertValidHash(hash);
    const path = this.pathFor(hash);
    if (!existsSync(path)) {
      throw new NotFoundException(`Arquivo não encontrado: ${hash}.enc`);
    }
    return readFile(path);
  }

  async delete(hash: string): Promise<void> {
    this.assertValidHash(hash);
    const path = this.pathFor(hash);
    if (!existsSync(path)) {
      return;
    }
    await unlink(path);
  }

  async exists(hash: string): Promise<boolean> {
    this.assertValidHash(hash);
    return existsSync(this.pathFor(hash));
  }

  private pathFor(hash: string): string {
    return join(this.uploadDir, `${hash}.enc`);
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  private assertValidHash(hash: string): void {
    if (!HASH_REGEX.test(hash)) {
      throw new Error(
        'hash inválido: exige 64 chars hex lowercase (SHA-256).',
      );
    }
  }
}
