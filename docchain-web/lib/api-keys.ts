import api from '@/lib/api';
import type { ApiKeySummary, CreatedApiKey } from '@/types/api-key';

export const MAX_API_KEYS = 5;

export async function listApiKeys(): Promise<ApiKeySummary[]> {
  const { data } = await api.get<ApiKeySummary[]>('/api-keys');
  return data;
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const { data } = await api.post<CreatedApiKey>('/api-keys', { name });
  return data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.delete(`/api-keys/${id}`);
}

// Endereço público da API, usado nos exemplos da documentação.
export function publicApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
