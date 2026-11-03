import { Document } from '@prisma/client';

export type DocumentWithVersionCount = Document & { versionCount: number };

export interface PaginatedDocuments {
  items: DocumentWithVersionCount[];
  total: number;
  page: number;
  limit: number;
}

export interface VersionTimeline {
  root: Document;
  versions: Document[];
  totalVersions: number;
}
