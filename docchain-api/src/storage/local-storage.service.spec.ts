import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let uploadDir: string;

  const hash =
    'a'.repeat(64);
  const buffer = Buffer.from('conteúdo cifrado de teste');

  beforeEach(async () => {
    uploadDir = mkdtempSync(join(tmpdir(), 'docchain-test-'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'UPLOAD_DIR') return uploadDir;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LocalStorageService>(LocalStorageService);
  });

  afterEach(() => {
    rmSync(uploadDir, { recursive: true, force: true });
  });

  describe('save', () => {
    it('grava arquivo em {hash}.enc e retorna storage ref', async () => {
      const ref = await service.save(hash, buffer);
      expect(ref).toBe(`local:${hash}.enc`);
      expect(await service.exists(hash)).toBe(true);
    });

    it('cria upload dir se não existir', async () => {
      rmSync(uploadDir, { recursive: true, force: true });
      const ref = await service.save(hash, buffer);
      expect(ref).toBe(`local:${hash}.enc`);
    });

    it('rejeita hash inválido (path traversal)', async () => {
      await expect(
        service.save('../evil', buffer),
      ).rejects.toThrow(/hash inválido/i);
      await expect(
        service.save('a'.repeat(63), buffer),
      ).rejects.toThrow(/hash inválido/i);
      await expect(
        service.save('ZZZ' + 'a'.repeat(61), buffer),
      ).rejects.toThrow(/hash inválido/i);
    });
  });

  describe('retrieve', () => {
    it('retorna buffer idêntico ao gravado', async () => {
      await service.save(hash, buffer);
      const retrieved = await service.retrieve(hash);
      expect(retrieved.equals(buffer)).toBe(true);
    });

    it('lança erro para hash inexistente', async () => {
      await expect(service.retrieve(hash)).rejects.toThrow(/não encontrado/i);
    });

    it('rejeita hash inválido', async () => {
      await expect(service.retrieve('../evil')).rejects.toThrow(
        /hash inválido/i,
      );
    });
  });

  describe('delete', () => {
    it('remove arquivo existente', async () => {
      await service.save(hash, buffer);
      await service.delete(hash);
      expect(await service.exists(hash)).toBe(false);
    });

    it('não lança para hash inexistente (idempotente)', async () => {
      await expect(service.delete(hash)).resolves.toBeUndefined();
    });

    it('rejeita hash inválido', async () => {
      await expect(service.delete('../evil')).rejects.toThrow(
        /hash inválido/i,
      );
    });
  });

  describe('exists', () => {
    it('true quando arquivo presente', async () => {
      await service.save(hash, buffer);
      expect(await service.exists(hash)).toBe(true);
    });

    it('false quando ausente', async () => {
      expect(await service.exists(hash)).toBe(false);
    });
  });

  describe('config validation', () => {
    it('lança erro se UPLOAD_DIR ausente', () => {
      const badConfig = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;
      expect(() => new LocalStorageService(badConfig)).toThrow(
        /UPLOAD_DIR/,
      );
    });
  });
});
