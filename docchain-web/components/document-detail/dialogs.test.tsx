import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { ShareDialog } from './ShareDialog';
import { deleteDocument, shareDocument } from '@/lib/documents';
import { httpError } from '@/test/fixtures';

vi.mock('@/lib/documents', () => ({ deleteDocument: vi.fn(), shareDocument: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia email e mensagem e fecha o dialog', async () => {
    vi.mocked(shareDocument).mockResolvedValue({} as never);
    const user = userEvent.setup();
    render(<ShareDialog documentId="doc-1" />);

    await user.click(screen.getByRole('button', { name: /Compartilhar por email/ }));
    await user.type(screen.getByLabelText('Email do destinatário'), 'juiz@tribunal.gov.br');
    await user.type(screen.getByLabelText('Mensagem (opcional)'), 'Segue o contrato');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(shareDocument).toHaveBeenCalledWith('doc-1', {
      email: 'juiz@tribunal.gov.br',
      message: 'Segue o contrato',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith('Documento enviado para juiz@tribunal.gov.br');
  });

  it('mensagem vazia não é enviada', async () => {
    vi.mocked(shareDocument).mockResolvedValue({} as never);
    const user = userEvent.setup();
    render(<ShareDialog documentId="doc-1" />);

    await user.click(screen.getByRole('button', { name: /Compartilhar por email/ }));
    await user.type(screen.getByLabelText('Email do destinatário'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(shareDocument).toHaveBeenCalledWith('doc-1', { email: 'a@b.com', message: undefined });
  });

  it('limite de envios (429) mostra mensagem específica', async () => {
    vi.mocked(shareDocument).mockRejectedValue(httpError(429));
    const user = userEvent.setup();
    render(<ShareDialog documentId="doc-1" />);

    await user.click(screen.getByRole('button', { name: /Compartilhar por email/ }));
    await user.type(screen.getByLabelText('Email do destinatário'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Limite de compartilhamentos/)));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('fica desabilitado quando o documento não está confirmado', () => {
    render(<ShareDialog documentId="doc-1" disabled />);
    expect(screen.getByRole('button', { name: /Compartilhar por email/ })).toBeDisabled();
  });
});

describe('DeleteDocumentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('avisa que o registro on-chain permanece e exclui ao confirmar', async () => {
    vi.mocked(deleteDocument).mockResolvedValue();
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(<DeleteDocumentDialog documentId="doc-1" fileName="contrato.pdf" onDeleted={onDeleted} />);

    await user.click(screen.getByRole('button', { name: /Excluir documento/ }));
    expect(screen.getByText(/registro na\s+blockchain é imutável/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(deleteDocument).toHaveBeenCalledWith('doc-1');
  });

  it('cancelar não exclui', async () => {
    const user = userEvent.setup();
    render(<DeleteDocumentDialog documentId="doc-1" fileName="contrato.pdf" onDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Excluir documento/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteDocument).not.toHaveBeenCalled();
  });

  it('falha mostra erro e não navega', async () => {
    vi.mocked(deleteDocument).mockRejectedValue(httpError(500, 'boom'));
    const onDeleted = vi.fn();
    const user = userEvent.setup();
    render(<DeleteDocumentDialog documentId="doc-1" fileName="contrato.pdf" onDeleted={onDeleted} />);

    await user.click(screen.getByRole('button', { name: /Excluir documento/ }));
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('boom'));
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
