import api from '@/lib/api';
import type { AuthenticatedUser } from '@/types/user';

export async function updateMe(name: string): Promise<AuthenticatedUser> {
  const { data } = await api.patch<AuthenticatedUser>('/auth/me', { name });
  return data;
}

export async function exportMe(): Promise<Blob> {
  const { data } = await api.get<unknown>('/auth/me/export');
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export async function deleteMe(password: string): Promise<void> {
  await api.delete('/auth/me', { data: { password } });
}
