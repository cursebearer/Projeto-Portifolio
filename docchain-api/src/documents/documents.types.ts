import { Document } from '@prisma/client';

export interface PaginatedDocuments {
  items: Document[];
  total: number;
  page: number;
  limit: number;
}
