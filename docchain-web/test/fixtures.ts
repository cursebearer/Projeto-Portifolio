import { AxiosError, AxiosHeaders } from 'axios';
import type { DocumentDto } from '@/types/document';

export function makeDocument(overrides: Partial<DocumentDto> = {}): DocumentDto {
  return {
    id: 'doc-1',
    userId: 'user-1',
    fileName: 'contrato.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    hash: 'a'.repeat(64),
    hashAlgorithm: 'SHA-256',
    storageType: 'LOCAL',
    storageRef: 'a'.repeat(64),
    encryptionIv: null,
    encryptionAuthTag: null,
    txHash: 'b'.repeat(64),
    network: 'sepolia',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    blockNumber: 42,
    status: 'CONFIRMED',
    errorMessage: null,
    uploadedAt: '2026-10-13T10:00:00Z',
    confirmedAt: '2026-10-13T10:00:15Z',
    updatedAt: '2026-10-13T10:00:15Z',
    deletedAt: null,
    previousDocumentId: null,
    ...overrides,
  };
}

export function httpError(status: number, message = 'erro'): AxiosError {
  return new AxiosError(message, 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message },
  });
}
