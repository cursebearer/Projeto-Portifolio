import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { CryptoService, EncryptedPayload } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  const encryptionKeyHex = randomBytes(32).toString('hex');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ENCRYPTION_KEY') return encryptionKeyHex;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  describe('hashFile', () => {
    it('produz SHA-256 hex de 64 chars', () => {
      const buffer = Buffer.from('conteúdo do documento');
      const hash = service.hashFile(buffer);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('é determinístico — mesmo buffer → mesmo hash', () => {
      const buffer = Buffer.from('mesma coisa');
      expect(service.hashFile(buffer)).toBe(service.hashFile(buffer));
    });

    it('buffers distintos geram hashes distintos', () => {
      const a = service.hashFile(Buffer.from('a'));
      const b = service.hashFile(Buffer.from('b'));
      expect(a).not.toBe(b);
    });

    it('vetor conhecido: sha256("abc")', () => {
      const expected =
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
      expect(service.hashFile(Buffer.from('abc'))).toBe(expected);
    });
  });

  describe('encrypt / decrypt', () => {
    const plaintext = Buffer.from(
      'documento confidencial — LGPD art. 46 exige criptografia',
      'utf8',
    );

    it('round-trip devolve buffer original', () => {
      const payload = service.encrypt(plaintext);
      const recovered = service.decrypt(payload);
      expect(recovered.equals(plaintext)).toBe(true);
    });

    it('gera IV único por chamada (12 bytes)', () => {
      const a = service.encrypt(plaintext);
      const b = service.encrypt(plaintext);
      expect(a.iv.length).toBe(12);
      expect(b.iv.length).toBe(12);
      expect(a.iv.equals(b.iv)).toBe(false);
    });

    it('gera authTag de 16 bytes', () => {
      const payload = service.encrypt(plaintext);
      expect(payload.authTag.length).toBe(16);
    });

    it('ciphertext difere do plaintext', () => {
      const payload = service.encrypt(plaintext);
      expect(payload.ciphertext.equals(plaintext)).toBe(false);
    });

    it('tampering no ciphertext lança erro (authTag inválido)', () => {
      const payload = service.encrypt(plaintext);
      payload.ciphertext[0] ^= 0xff;
      expect(() => service.decrypt(payload)).toThrow();
    });

    it('tampering no authTag lança erro', () => {
      const payload = service.encrypt(plaintext);
      payload.authTag[0] ^= 0xff;
      expect(() => service.decrypt(payload)).toThrow();
    });

    it('IV diferente lança erro na decifra', () => {
      const payload = service.encrypt(plaintext);
      payload.iv = randomBytes(12);
      expect(() => service.decrypt(payload)).toThrow();
    });
  });

  describe('serialize / deserialize', () => {
    it('serialize concatena iv(12) + authTag(16) + ciphertext', () => {
      const payload = service.encrypt(Buffer.from('teste'));
      const serialized = service.serializePayload(payload);
      expect(serialized.length).toBe(
        12 + 16 + payload.ciphertext.length,
      );
      expect(serialized.subarray(0, 12).equals(payload.iv)).toBe(true);
      expect(serialized.subarray(12, 28).equals(payload.authTag)).toBe(true);
    });

    it('round-trip serialize → deserialize → decrypt', () => {
      const original = Buffer.from('documento serializado');
      const payload = service.encrypt(original);
      const serialized = service.serializePayload(payload);
      const deserialized = service.deserializePayload(serialized);
      const recovered = service.decrypt(deserialized);
      expect(recovered.equals(original)).toBe(true);
    });

    it('deserialize rejeita buffer menor que header (12+16)', () => {
      expect(() => service.deserializePayload(Buffer.alloc(20))).toThrow();
    });
  });

  describe('config validation', () => {
    it('lança erro se ENCRYPTION_KEY ausente', () => {
      const badConfig = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;
      expect(() => new CryptoService(badConfig)).toThrow(
        /ENCRYPTION_KEY/,
      );
    });

    it('lança erro se ENCRYPTION_KEY não for 64 hex chars', () => {
      const badConfig = {
        get: jest.fn(() => 'chave-curta'),
      } as unknown as ConfigService;
      expect(() => new CryptoService(badConfig)).toThrow(
        /ENCRYPTION_KEY/,
      );
    });
  });

  describe('EncryptedPayload contract', () => {
    it('shape do payload é { iv, authTag, ciphertext } (Buffers)', () => {
      const payload: EncryptedPayload = service.encrypt(Buffer.from('x'));
      expect(Buffer.isBuffer(payload.iv)).toBe(true);
      expect(Buffer.isBuffer(payload.authTag)).toBe(true);
      expect(Buffer.isBuffer(payload.ciphertext)).toBe(true);
    });
  });
});
