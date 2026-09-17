import api from '@/lib/api';
import type {
  DocumentDto,
  ListDocumentsQuery,
  PaginatedDocuments,
  VerifyResult,
  VerifyHashDto,
  VersionTimeline,
  DocumentShareDto,
  ShareDocumentInput,
} from '@/types/document';

export async function listDocuments(
  query: ListDocumentsQuery = {},
): Promise<PaginatedDocuments> {
  const { data } = await api.get<PaginatedDocuments>('/documents', {
    params: query,
  });
  return data;
}

export async function getDocument(id: string): Promise<DocumentDto> {
  const { data } = await api.get<DocumentDto>(`/documents/${id}`);
  return data;
}

export async function uploadDocument(file: File): Promise<DocumentDto> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<DocumentDto>('/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string): Promise<Blob> {
  const response = await api.get<Blob>(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function verifyPrivate(dto: VerifyHashDto): Promise<VerifyResult> {
  const { data } = await api.post<VerifyResult>('/documents/verify', dto);
  return data;
}

export async function verifyPublic(hash: string): Promise<VerifyResult> {
  const clean = hash.startsWith('0x') ? hash.slice(2) : hash;
  const { data } = await api.get<VerifyResult>(`/verify/public/${clean}`);
  return data;
}

export async function createVersion(
  previousDocumentId: string,
  file: File,
): Promise<DocumentDto> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<DocumentDto>(
    `/documents/${previousDocumentId}/versions`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function getVersions(id: string): Promise<VersionTimeline> {
  const { data } = await api.get<VersionTimeline>(`/documents/${id}/versions`);
  return data;
}

export async function shareDocument(
  id: string,
  input: ShareDocumentInput,
): Promise<DocumentShareDto> {
  const { data } = await api.post<DocumentShareDto>(
    `/documents/${id}/share`,
    input,
  );
  return data;
}

export interface DocumentStats {
  total: number;
  confirmed: number;
  pending: number;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const [all, confirmed, pending] = await Promise.all([
    listDocuments({ limit: 1 }),
    listDocuments({ status: 'CONFIRMED', limit: 1 }),
    listDocuments({ status: 'PENDING', limit: 1 }),
  ]);
  return {
    total: all.total,
    confirmed: confirmed.total,
    pending: pending.total,
  };
}
