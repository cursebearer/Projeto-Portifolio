export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';
export type StorageType = 'LOCAL' | 'IPFS';

export interface DocumentDto {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  hash: string;
  hashAlgorithm: string;
  storageType: StorageType;
  storageRef: string | null;
  encryptionIv: string | null;
  encryptionAuthTag: string | null;
  txHash: string | null;
  network: string | null;
  walletAddress: string | null;
  blockNumber: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  uploadedAt: string;
  confirmedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
  previousDocumentId: string | null;
}

export interface PaginatedDocuments {
  items: DocumentDto[];
  total: number;
  page: number;
  limit: number;
}

export interface ListDocumentsQuery {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
}

export interface VerifyResult {
  documentHash: string;
  storageRef: string;
  registeredBy: string;
  timestamp: number;
  exists: boolean;
}

export interface VerifyHashDto {
  hash: string;
}

export interface VersionTimeline {
  root: DocumentDto;
  versions: DocumentDto[];
  totalVersions: number;
}

export interface DocumentShareDto {
  id: string;
  documentId: string;
  sharedByUserId: string;
  sharedWithEmail: string;
  message: string | null;
  comprovanteHash: string;
  sentAt: string;
  verificationCount: number;
}

export interface ShareDocumentInput {
  email: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: { status: 'up' | 'down'; detail?: string };
    blockchain: { status: 'up' | 'down'; blockNumber?: number; detail?: string };
  };
}
