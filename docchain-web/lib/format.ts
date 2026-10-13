export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function with0x(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}

export function truncateHash(hash: string): string {
  const clean = with0x(hash);
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export function etherscanTxUrl(txHash: string, network: string | null): string {
  const net = network ?? 'sepolia';
  const host = net === 'mainnet' ? 'etherscan.io' : `${net}.etherscan.io`;
  return `https://${host}/tx/${with0x(txHash)}`;
}
