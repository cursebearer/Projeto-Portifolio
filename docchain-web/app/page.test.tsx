import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

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
    for (const link of screen.getAllByRole('link', { name: /Verificar um documento/ })) {
      expect(link).toHaveAttribute('href', '/verify');
    }
    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.queryByText(/open source/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /GitHub/ })).not.toBeInTheDocument();
  });

  it('usuário logado vai direto para o dashboard', async () => {
    token = 'jwt';
    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/dashboard');
  });
});
