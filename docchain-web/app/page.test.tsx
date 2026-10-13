import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';
import { GITHUB_URL } from '@/lib/site';

let token: string | undefined;
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (token ? { value: token } : undefined) }),
}));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

describe('Home', () => {
  beforeEach(() => {
    token = undefined;
    redirect.mockClear();
  });

  it('visitante vê a landing com chamadas para criar conta e verificar', async () => {
    render(await Home());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Prove que seu documento é o original.');
    expect(screen.getAllByRole('link', { name: /Criar conta grátis/ })[0]).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /Verificar um documento/ })).toHaveAttribute('href', '/verify');
    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver o código no GitHub/ })).toHaveAttribute('href', GITHUB_URL);
  });

  it('usuário logado vai direto para o dashboard', async () => {
    token = 'jwt';
    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });
});
