export async function sha256Hex(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const SHA256_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;

export function isValidSha256(value: string): boolean {
  return SHA256_REGEX.test(value.trim());
}

export function sameHash(a: string, b: string): boolean {
  const strip = (h: string) => (h.startsWith('0x') ? h.slice(2) : h).toLowerCase();
  return strip(a) === strip(b);
}
