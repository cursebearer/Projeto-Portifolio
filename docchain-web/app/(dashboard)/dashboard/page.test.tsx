import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';
import { getDocumentStats, listDocuments } from '@/lib/documents';
import { makeDocument } from '@/test/fixtures';

vi.mock('@/lib/documents', () => ({ listDocuments: vi.fn(), getDocumentStats: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sem documentos mostra convite para o primeiro upload', async () => {
    vi.mocked(listDocuments).mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });
    vi.mocked(getDocumentStats).mockResolvedValue({ total: 0, confirmed: 0, pending: 0, failed: 0 });
    render(<DashboardPage />);

    expect(await screen.findByText('Você ainda não registrou nenhum documento')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar primeiro documento/ })).toHaveAttribute('href', '/upload');
  });

  it('lista documentos e filtra pela busca local', async () => {
    vi.mocked(listDocuments).mockResolvedValue({
      items: [
        makeDocument({ id: 'd1', fileName: 'contrato.pdf' }),
        makeDocument({ id: 'd2', fileName: 'nota-fiscal.xml', hash: 'c'.repeat(64) }),
      ],
      total: 2,
      page: 1,
      limit: 10,
    });
    vi.mocked(getDocumentStats).mockResolvedValue({ total: 2, confirmed: 2, pending: 0, failed: 0 });
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(await screen.findByText('contrato.pdf')).toBeInTheDocument();
    expect(screen.getByText('nota-fiscal.xml')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar por nome ou hash...'), 'nota');
    expect(screen.queryByText('contrato.pdf')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Buscar por nome ou hash...'));
    await user.type(screen.getByPlaceholderText('Buscar por nome ou hash...'), 'inexistente');
    expect(screen.getByText('Nenhum documento encontrado com esses filtros.')).toBeInTheDocument();
  });

  it('filtro de status consulta a API com o status escolhido', async () => {
    vi.mocked(listDocuments).mockResolvedValue({ items: [makeDocument()], total: 1, page: 1, limit: 10 });
    vi.mocked(getDocumentStats).mockResolvedValue({ total: 1, confirmed: 1, pending: 0, failed: 0 });
    const user = userEvent.setup();
    render(<DashboardPage />);
    await screen.findByText('contrato.pdf');

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'FAILED');

    expect(listDocuments).toHaveBeenLastCalledWith({ page: 1, limit: 10, status: 'FAILED' });
  });
});
