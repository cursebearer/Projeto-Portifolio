import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

export interface EncryptedPayload {
  iv: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
}

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_HEX_LENGTH = 64;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.get<string>('ENCRYPTION_KEY');
    if (!hex || hex.length !== KEY_HEX_LENGTH || !/^[a-fA-F0-9]+$/.test(hex)) {
      throw new Error(
        'ENCRYPTION_KEY inválida: exige 64 chars hex (32 bytes AES-256).',
      );
    }
    this.key = Buffer.from(hex, 'hex');
  }

  hashFile(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  encrypt(buffer: Buffer): EncryptedPayload {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { iv, authTag, ciphertext };
  }

  decrypt(payload: EncryptedPayload): Buffer {
    const decipher = createDecipheriv(ALGORITHM, this.key, payload.iv);
    decipher.setAuthTag(payload.authTag);
    return Buffer.concat([
      decipher.update(payload.ciphertext),
      decipher.final(),
    ]);
  }

  serializePayload(payload: EncryptedPayload): Buffer {
    return Buffer.concat([payload.iv, payload.authTag, payload.ciphertext]);
  }

  deserializePayload(buffer: Buffer): EncryptedPayload {
    if (buffer.length < IV_BYTES + AUTH_TAG_BYTES) {
      throw new Error(
        `Payload cifrado inválido: mínimo ${IV_BYTES + AUTH_TAG_BYTES} bytes.`,
      );
    }
    const iv = buffer.subarray(0, IV_BYTES);
    const authTag = buffer.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const ciphertext = buffer.subarray(IV_BYTES + AUTH_TAG_BYTES);
    return { iv, authTag, ciphertext };
  }
}
