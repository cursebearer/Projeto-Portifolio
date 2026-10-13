import type { Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';

export function setAccessTokenCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number,
  secure: boolean,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  });
}
