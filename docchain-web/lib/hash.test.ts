import { describe, expect, it } from 'vitest';
import { sameHash, sha256Hex } from './hash';

describe('sha256Hex', () => {
  it('calcula o SHA-256 em hex minúsculo', async () => {
    const hash = await sha256Hex(new Blob(['abc']));
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('sameHash', () => {
  it('ignora prefixo 0x e caixa', () => {
    expect(sameHash('0xABCD', 'abcd')).toBe(true);
    expect(sameHash('abcd', 'abce')).toBe(false);
  });
});
