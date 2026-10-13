import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentDetailPage from './page';
import { downloadDocument, getDocument, getVersions } from '@/lib/documents';
import { saveBlob } from '@/lib/download';
import { httpError, makeDocument } from '@/test/fixtures';

const replace = vi.fn();
const push = vi.fn();
let params = { id: 'doc-1' };

vi.mock('next/navigation', () => ({
  useParams: () => params,
  useRouter: () => ({ replace, push }),
}));
vi.mock('@/lib/documents', () => ({
  getDocument: vi.fn(),
  getVersions: vi.fn(),
  downloadDocument: vi.fn(),
  verifyPrivate: vi.fn(),
  shareDocument: vi.fn(),
  deleteDocument: vi.fn(),
  createVersion: vi.fn(),
}));
vi.mock('@/lib/download', () => ({ saveBlob: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: 'user-1', email: 'rafael@docchain.dev', name: 'Rafael' } }),
}));

describe('DocumentDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params = { id: 'doc-1' };
    vi.mocked(getVersions).mockResolvedValue({ root: makeDocument(), versions: [], totalVersions: 1 });
  });

  it('exibe metadados, prova blockchain e link do Etherscan', async () => {
    vi.mocked(getDocument).mockResolvedValue(makeDocument());
    render(<DocumentDetailPage />);

    expect(await screen.findByRole('heading', { name: 'contrato.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Rafael (você)')).toBeInTheDocument();
    expect(screen.getByText(`0x${'a'.repeat(64)}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Etherscan/ })).toHaveAttribute(
      'href',
      `https://sepolia.etherscan.io/tx/0x${'b'.repeat(64)}`,
    );
    expect(screen.getByText('Verificar Integridade')).toBeInTheDocument();
  });

  it('baixa o arquivo original com o nome correto', async () => {
    const blob = new Blob(['x']);
    vi.mocked(getDocument).mockResolvedValue(makeDocument());
    vi.mocked(downloadDocument).mockResolvedValue(blob);
    const user = userEvent.setup();
    render(<DocumentDetailPage />);

    await user.click(await screen.findByRole('button', { name: /Baixar original/ }));

    await waitFor(() => expect(saveBlob).toHaveBeenCalledWith(blob, 'contrato.pdf'));
  });

  it('documento não confirmado desabilita download e compartilhamento', async () => {
    vi.mocked(getDocument).mockResolvedValue(
      makeDocument({ status: 'FAILED', txHash: null, confirmedAt: null, errorMessage: 'sem saldo' }),
    );
    render(<DocumentDetailPage />);

    expect(await screen.findByRole('button', { name: /Baixar original/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Compartilhar por email/ })).toBeDisabled();
    expect(screen.getByText(/Registro on-chain falhou: sem saldo/)).toBeInTheDocument();
    expect(screen.queryByText('Verificar Integridade')).not.toBeInTheDocument();
  });

  it('404 mostra documento não encontrado', async () => {
    vi.mocked(getDocument).mockRejectedValue(httpError(404));
    render(<DocumentDetailPage />);

    expect(await screen.findByText('Documento não encontrado.')).toBeInTheDocument();
  });

  it('lista versões em ordem e destaca a atual', async () => {
    const v1 = makeDocument({ id: 'doc-1', fileName: 'contrato.pdf' });
    const v2 = makeDocument({
      id: 'doc-2',
      fileName: 'contrato-assinado.pdf',
      previousDocumentId: 'doc-1',
      uploadedAt: '2026-10-14T10:00:00Z',
    });
    params = { id: 'doc-2' };
    vi.mocked(getDocument).mockResolvedValue(v2);
    vi.mocked(getVersions).mockResolvedValue({ root: v1, versions: [v2], totalVersions: 2 });
    render(<DocumentDetailPage />);

    const current = await screen.findByRole('link', { current: 'page' });
    expect(current).toHaveAttribute('href', '/documents/doc-2');
    expect(current).toHaveTextContent('v2');
    expect(screen.getByRole('link', { name: /v1.*contrato\.pdf/ })).toHaveAttribute('href', '/documents/doc-1');
  });
});
