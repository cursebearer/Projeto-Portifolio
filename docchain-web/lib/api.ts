import axios, { AxiosError } from 'axios';

const AUTH_PATHS = ['/auth/login', '/auth/register'];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint = AUTH_PATHS.some((p) => requestUrl.includes(p));
    const isPublicPage =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/register') ||
      window.location.pathname.startsWith('/verify');

    if (status === 401 && !isAuthEndpoint && !isPublicPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
