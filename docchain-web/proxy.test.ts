import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

function request(path: string, token?: string): NextRequest {
  const req = new NextRequest(new URL(path, 'http://localhost:3001'));
  if (token) req.cookies.set('access_token', token);
  return req;
}

function location(path: string, token?: string): string | null {
  return proxy(request(path, token)).headers.get('location');
}

describe('proxy', () => {
  it('home, verificação e login são públicos', () => {
    expect(location('/')).toBeNull();
    expect(location('/verify')).toBeNull();
    expect(location('/verify/abc')).toBeNull();
    expect(location('/login')).toBeNull();
  });

  it('rotas protegidas sem sessão vão para o login', () => {
    expect(location('/dashboard')).toBe('http://localhost:3001/login');
    expect(location('/documents/123')).toBe('http://localhost:3001/login');
  });

  it('com sessão, login e cadastro vão para o dashboard', () => {
    expect(location('/login', 'jwt')).toBe('http://localhost:3001/dashboard');
    expect(location('/register', 'jwt')).toBe('http://localhost:3001/dashboard');
    expect(location('/dashboard', 'jwt')).toBeNull();
  });
});
