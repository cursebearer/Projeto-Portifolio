export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';

export interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  hash: string;
  hashAlgorithm: string;
  storageType: 'LOCAL' | 'IPFS';
  storageRef?: string;
  txHash?: string;
  network?: string;
  walletAddress?: string;
  blockNumber?: number;
  status: DocumentStatus;
  uploadedAt: string;
  confirmedAt?: string;
}

export interface PaginatedDocuments {
  data: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VerificationResult {
  verified: boolean;
  hashMatch: boolean;
  blockchainConfirmed: boolean;
  document?: Partial<Document>;
  blockchain?: {
    exists: boolean;
    registeredAt?: string;
    registeredBy?: string;
    storageRef?: string;
    txHash?: string;
  };
  recalculatedHash?: string;
  reason?: string;
}
