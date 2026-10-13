import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UploadPage from './page';
import { uploadDocument } from '@/lib/documents';
import { httpError, makeDocument } from '@/test/fixtures';
import type { DocumentDto } from '@/types/document';

vi.mock('@/lib/documents', () => ({ uploadDocument: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const uploadMock = vi.mocked(uploadDocument);

const confirmedDoc: DocumentDto = makeDocument();

async function selectFile(name = 'contrato.pdf', size = 1024) {
  const user = userEvent.setup();
  const file = new File(['x'.repeat(size)], name, { type: 'application/pdf' });
  await user.upload(screen.getByLabelText('Selecionar arquivo'), file);
  return user;
}

describe('UploadPage', () => {
  beforeEach(() => {
    uploadMock.mockReset();
  });

  it('botão de registrar fica desabilitado sem arquivo', () => {
    render(<UploadPage />);
    expect(screen.getByRole('button', { name: 'Registrar na Blockchain' })).toBeDisabled();
  });

  it('mostra o arquivo selecionado e permite remover', async () => {
    render(<UploadPage />);
    const user = await selectFile();

    expect(screen.getByText('contrato.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar na Blockchain' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Remover arquivo' }));
    expect(screen.queryByText('contrato.pdf')).not.toBeInTheDocument();
  });

  it('registra e exibe hash, transação e link do Etherscan', async () => {
    uploadMock.mockImplementation(async (_file, onProgress) => {
      onProgress?.(1);
      return confirmedDoc;
    });
    render(<UploadPage />);
    const user = await selectFile();

    await user.click(screen.getByRole('button', { name: 'Registrar na Blockchain' }));

    expect(await screen.findByText('Documento registrado na blockchain')).toBeInTheDocument();
    expect(screen.getByText(`0x${'a'.repeat(64)}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
      'href',
      `https://sepolia.etherscan.io/tx/0x${'b'.repeat(64)}`,
    );
    expect(screen.getByRole('link', { name: 'Ver documento' })).toHaveAttribute('href', '/documents/doc-1');
  });

  it('mostra etapas durante o processamento', async () => {
    let resolve: (doc: DocumentDto) => void = () => {};
    uploadMock.mockImplementation((_file, onProgress) => {
      onProgress?.(1);
      return new Promise((r) => {
        resolve = r;
      });
    });
    render(<UploadPage />);
    const user = await selectFile();

    await user.click(screen.getByRole('button', { name: 'Registrar na Blockchain' }));

    expect(await screen.findByText('Processando registro on-chain')).toBeInTheDocument();
    expect(screen.getByText('Não feche esta janela durante o processo.')).toBeInTheDocument();
    resolve(confirmedDoc);
    expect(await screen.findByText('Documento registrado na blockchain')).toBeInTheDocument();
  });

  it('hash duplicado (409) mostra mensagem clara e permite tentar de novo', async () => {
    uploadMock.mockRejectedValueOnce(httpError(409));
    render(<UploadPage />);
    const user = await selectFile();

    await user.click(screen.getByRole('button', { name: 'Registrar na Blockchain' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/já foi registrado/);

    uploadMock.mockResolvedValueOnce(confirmedDoc);
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Documento registrado na blockchain')).toBeInTheDocument();
  });

  it('"Registrar outro" volta ao estado inicial', async () => {
    uploadMock.mockResolvedValueOnce(confirmedDoc);
    render(<UploadPage />);
    const user = await selectFile();
    await user.click(screen.getByRole('button', { name: 'Registrar na Blockchain' }));
    await user.click(await screen.findByRole('button', { name: 'Registrar outro' }));

    expect(screen.getByText(/Arraste seu arquivo aqui/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar na Blockchain' })).toBeDisabled();
  });
});
