import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ login: vi.fn(), isLoading: false }),
}));

describe('LoginPage', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    vi.clearAllMocks();
  });

  it('avisa quando a sessão expirou', () => {
    window.history.replaceState(null, '', '/login?expirada=1');
    render(<LoginPage />);
    expect(toast.info).toHaveBeenCalledWith('Sua sessão expirou por inatividade. Entre novamente.');
  });

  it('não avisa em um acesso normal', () => {
    window.history.replaceState(null, '', '/login');
    render(<LoginPage />);
    expect(toast.info).not.toHaveBeenCalled();
  });
});
