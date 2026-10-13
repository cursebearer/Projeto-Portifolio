import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicVerify } from './PublicVerify';
import { verifyPublic } from '@/lib/documents';
import { httpError } from '@/test/fixtures';
import type { VerifyResult } from '@/types/document';

vi.mock('@/lib/documents', () => ({ verifyPublic: vi.fn() }));

const verifyMock = vi.mocked(verifyPublic);
const ABC_HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function onChain(overrides: Partial<VerifyResult> = {}): VerifyResult {
  return {
    documentHash: `0x${ABC_HASH}`,
    storageRef: ABC_HASH,
    registeredBy: '0x0a1b7FE06707d2acA790fAf8F34d644B3F9606Ab',
    timestamp: 1_760_350_000,
    exists: true,
    ...overrides,
  };
}

describe('PublicVerify', () => {
  beforeEach(() => {
    verifyMock.mockReset();
  });

  it('calcula o hash do arquivo no navegador e mostra documento autêntico', async () => {
    verifyMock.mockResolvedValue(onChain());
    const user = userEvent.setup();
    render(<PublicVerify />);

    await user.upload(screen.getByLabelText('Arquivo para verificar'), new File(['abc'], 'doc.txt'));

    expect(await screen.findByRole('status')).toHaveTextContent('Documento Autêntico');
    expect(verifyMock).toHaveBeenCalledWith(ABC_HASH);
    expect(screen.getByText('0x0a1b...06Ab')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar conta gratuita' })).toHaveAttribute('href', '/register');
  });

  it('valida o formato do hash antes de consultar', async () => {
    const user = userEvent.setup();
    render(<PublicVerify />);
    await user.click(screen.getByRole('tab', { name: /Colar hash/ }));

    await user.type(screen.getByLabelText('Hash SHA-256'), 'abc123');

    expect(screen.getByText(/Formato inválido/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verificar autenticidade' })).toBeDisabled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('hash não registrado mostra documento não encontrado', async () => {
    verifyMock.mockResolvedValue(onChain({ exists: false }));
    const user = userEvent.setup();
    render(<PublicVerify />);
    await user.click(screen.getByRole('tab', { name: /Colar hash/ }));

    await user.type(screen.getByLabelText('Hash SHA-256'), `0x${'c'.repeat(64)}`);
    expect(screen.getByText(/Formato válido/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Verificar autenticidade' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Documento não encontrado');
    expect(verifyMock).toHaveBeenCalledWith(`0x${'c'.repeat(64)}`);
  });

  it('limite de requisições (429) mostra mensagem específica', async () => {
    verifyMock.mockRejectedValue(httpError(429));
    const user = userEvent.setup();
    render(<PublicVerify />);
    await user.click(screen.getByRole('tab', { name: /Colar hash/ }));
    await user.type(screen.getByLabelText('Hash SHA-256'), 'd'.repeat(64));
    await user.click(screen.getByRole('button', { name: 'Verificar autenticidade' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Muitas verificações/);
  });

  it('com hash na URL (QR do comprovante) verifica automaticamente', async () => {
    verifyMock.mockResolvedValue(onChain());
    render(<PublicVerify initialHash={ABC_HASH} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Documento Autêntico');
    expect(screen.getByRole('tab', { name: /Colar hash/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Hash SHA-256')).toHaveValue(ABC_HASH);
  });

  it('usuário logado não vê o convite para criar conta', async () => {
    verifyMock.mockResolvedValue(onChain());
    render(<PublicVerify initialHash={ABC_HASH} showSignupCta={false} />);

    expect(await screen.findByRole('status')).toHaveTextContent('Documento Autêntico');
    expect(screen.queryByRole('link', { name: 'Criar conta gratuita' })).not.toBeInTheDocument();
  });

  it('hash inválido na URL não consulta a blockchain', () => {
    render(<PublicVerify initialHash="nao-e-hash" />);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Formato inválido/)).toBeInTheDocument();
  });
});
