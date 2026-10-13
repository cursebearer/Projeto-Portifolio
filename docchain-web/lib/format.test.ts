import { describe, expect, it } from 'vitest';
import { etherscanTxUrl, formatBytes, truncateHash, with0x } from './format';

describe('formatBytes', () => {
  it('formata bytes, KB, MB e GB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1.24 * 1024 * 1024)).toBe('1.24 MB');
    expect(formatBytes(2 * 1024 ** 3)).toBe('2.00 GB');
  });
});

describe('with0x / truncateHash', () => {
  const hash = 'ab'.repeat(32);

  it('adiciona 0x só quando falta', () => {
    expect(with0x(hash)).toBe(`0x${hash}`);
    expect(with0x(`0x${hash}`)).toBe(`0x${hash}`);
  });

  it('trunca mantendo prefixo e sufixo', () => {
    expect(truncateHash(hash)).toBe('0xabab...abab');
  });
});

describe('etherscanTxUrl', () => {
  it('usa subdomínio da rede de teste', () => {
    expect(etherscanTxUrl('abc', 'sepolia')).toBe('https://sepolia.etherscan.io/tx/0xabc');
  });

  it('assume sepolia quando a rede é nula', () => {
    expect(etherscanTxUrl('0xabc', null)).toBe('https://sepolia.etherscan.io/tx/0xabc');
  });

  it('usa domínio raiz na mainnet', () => {
    expect(etherscanTxUrl('abc', 'mainnet')).toBe('https://etherscan.io/tx/0xabc');
  });
});
