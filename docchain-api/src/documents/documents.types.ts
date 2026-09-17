import { Document } from '@prisma/client';

export interface PaginatedDocuments {
  items: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface VersionTimeline {
  root: Document;
  versions: Document[];
  totalVersions: number;
}
