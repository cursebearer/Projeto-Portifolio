import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifyIntegrityCard } from './VerifyIntegrityCard';
import { verifyPrivate } from '@/lib/documents';
import { httpError } from '@/test/fixtures';

vi.mock('@/lib/documents', () => ({ verifyPrivate: vi.fn() }));

const verifyMock = vi.mocked(verifyPrivate);
const ABC_HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

async function dropFile(content: string) {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText('Arquivo para verificar'), new File([content], 'doc.txt'));
}

describe('VerifyIntegrityCard', () => {
  beforeEach(() => {
    verifyMock.mockReset();
  });

  it('arquivo idêntico e presente on-chain é autêntico', async () => {
    verifyMock.mockResolvedValue({ exists: true, documentHash: ABC_HASH, storageRef: '', registeredBy: '', timestamp: 0 });
    render(<VerifyIntegrityCard expectedHash={ABC_HASH} />);
    await dropFile('abc');

    expect(await screen.findByRole('status')).toHaveTextContent('Documento autêntico');
    expect(verifyMock).toHaveBeenCalledWith({ hash: ABC_HASH });
  });

  it('arquivo diferente falha sem consultar a blockchain', async () => {
    render(<VerifyIntegrityCard expectedHash={ABC_HASH} />);
    await dropFile('abd');

    expect(await screen.findByRole('alert')).toHaveTextContent('hash não coincide');
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('hash igual mas ausente on-chain falha', async () => {
    verifyMock.mockResolvedValue({ exists: false, documentHash: ABC_HASH, storageRef: '', registeredBy: '', timestamp: 0 });
    render(<VerifyIntegrityCard expectedHash={`0x${ABC_HASH}`} />);
    await dropFile('abc');

    expect(await screen.findByRole('alert')).toHaveTextContent('não foi encontrado na blockchain');
  });

  it('erro da API é exibido', async () => {
    verifyMock.mockImplementation(async () => { throw httpError(500, 'RPC fora do ar'); });
    render(<VerifyIntegrityCard expectedHash={ABC_HASH} />);
    await dropFile('abc');

    expect(await screen.findByRole('alert')).toHaveTextContent('RPC fora do ar');
  });
});
