import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountPage from './page';
import { deleteMe, exportMe, updateMe } from '@/lib/account';
import { saveBlob } from '@/lib/download';
import { httpError } from '@/test/fixtures';

const replace = vi.fn();
const setUser = vi.fn();
const clearSession = vi.fn();
const user = { id: 'u1', email: 'rafael@docchain.dev', name: 'Rafael', createdAt: '2026-10-01T10:00:00Z' };

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/account', () => ({ updateMe: vi.fn(), exportMe: vi.fn(), deleteMe: vi.fn() }));
vi.mock('@/lib/download', () => ({ saveBlob: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user, setUser, clearSession }),
}));

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra e-mail bloqueado e salva novo nome', async () => {
    vi.mocked(updateMe).mockResolvedValue({ ...user, name: 'Rafael Pavesi' });
    const userEv = userEvent.setup();
    render(<AccountPage />);

    expect(screen.getByLabelText('E-mail')).toBeDisabled();
    const save = screen.getByRole('button', { name: 'Salvar' });
    expect(save).toBeDisabled();

    await userEv.clear(screen.getByLabelText('Nome'));
    await userEv.type(screen.getByLabelText('Nome'), 'Rafael Pavesi');
    await userEv.click(save);

    expect(updateMe).toHaveBeenCalledWith('Rafael Pavesi');
    await waitFor(() => expect(setUser).toHaveBeenCalledWith({ ...user, name: 'Rafael Pavesi' }));
  });

  it('exporta os dados em JSON', async () => {
    const blob = new Blob(['{}']);
    vi.mocked(exportMe).mockResolvedValue(blob);
    const userEv = userEvent.setup();
    render(<AccountPage />);

    await userEv.click(screen.getByRole('button', { name: /Exportar dados/ }));

    await waitFor(() =>
      expect(saveBlob).toHaveBeenCalledWith(blob, expect.stringMatching(/^docchain-meus-dados-\d{4}-\d{2}-\d{2}\.json$/)),
    );
  });

  it('senha incorreta na exclusão mostra erro e mantém a sessão', async () => {
    vi.mocked(deleteMe).mockRejectedValue(httpError(403));
    const userEv = userEvent.setup();
    render(<AccountPage />);

    await userEv.click(screen.getByRole('button', { name: /Excluir minha conta/ }));
    await userEv.type(screen.getByLabelText('Confirme sua senha'), 'errada');
    await userEv.click(screen.getByRole('button', { name: 'Excluir conta' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Senha incorreta.'));
    expect(clearSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('exclusão confirmada limpa a sessão e volta para a home', async () => {
    vi.mocked(deleteMe).mockResolvedValue();
    const userEv = userEvent.setup();
    render(<AccountPage />);

    await userEv.click(screen.getByRole('button', { name: /Excluir minha conta/ }));
    expect(screen.getByText(/impressões digitais já gravadas na blockchain permanecem/)).toBeInTheDocument();
    await userEv.type(screen.getByLabelText('Confirme sua senha'), 'senha12345');
    await userEv.click(screen.getByRole('button', { name: 'Excluir conta' }));

    expect(deleteMe).toHaveBeenCalledWith('senha12345');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(clearSession).toHaveBeenCalled();
  });
});
