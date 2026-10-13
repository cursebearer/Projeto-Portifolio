import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Shell } from './Shell';

const replace = vi.fn();
const logout = vi.fn();
const fetchMe = vi.fn();
let pathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      user: { id: 'u1', email: 'rafael@docchain.dev', name: 'Rafael Pavesi' },
      isHydrated: true,
      fetchMe,
      logout,
    }),
}));

describe('Shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = '/dashboard';
  });

  it('mostra navegação sem o link quebrado de Documentos', () => {
    render(<Shell>conteúdo</Shell>);
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })[0];

    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Novo upload' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Verificar' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Documentos' })).not.toBeInTheDocument();
    expect(screen.getByText('RP')).toBeInTheDocument();
  });

  it('detalhe de documento marca Dashboard como ativo', () => {
    pathname = '/documents/abc';
    render(<Shell>conteúdo</Shell>);
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })[0];
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('menu mobile abre e fecha ao navegar', async () => {
    const user = userEvent.setup();
    render(<Shell>conteúdo</Shell>);
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const navs = screen.getAllByRole('navigation', { name: 'Principal' });
    expect(navs).toHaveLength(2);

    await user.click(within(navs[1]).getByRole('link', { name: 'Novo upload' }));
    expect(screen.getAllByRole('navigation', { name: 'Principal' })).toHaveLength(1);
  });

  it('sair encerra a sessão e volta ao login', async () => {
    logout.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Shell>conteúdo</Shell>);

    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logout).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
