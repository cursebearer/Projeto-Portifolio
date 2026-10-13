import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryCard } from './RetryCard';
import { uploadDocument } from '@/lib/documents';
import { httpError, makeDocument } from '@/test/fixtures';

vi.mock('@/lib/documents', () => ({ uploadDocument: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ABC_HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const failed = makeDocument({ hash: ABC_HASH, status: 'FAILED', txHash: null, confirmedAt: null });

async function drop(content: string) {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText('Arquivo para reenviar'), new File([content], 'contrato.pdf'));
}

describe('RetryCard', () => {
  beforeEach(() => {
    vi.mocked(uploadDocument).mockReset();
  });

  it('reenvia o mesmo arquivo e devolve o documento confirmado', async () => {
    const confirmed = makeDocument({ hash: ABC_HASH, status: 'CONFIRMED' });
    vi.mocked(uploadDocument).mockResolvedValue(confirmed);
    const onRetried = vi.fn();
    render(<RetryCard document={failed} onRetried={onRetried} />);

    await drop('abc');

    await waitFor(() => expect(onRetried).toHaveBeenCalledWith(confirmed));
  });

  it('arquivo diferente é recusado sem chamar a API', async () => {
    render(<RetryCard document={failed} onRetried={vi.fn()} />);

    await drop('outro conteúdo');

    expect(await screen.findByRole('alert')).toHaveTextContent('diferente do original');
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it('erro da API é exibido', async () => {
    vi.mocked(uploadDocument).mockRejectedValue(httpError(408));
    const onRetried = vi.fn();
    render(<RetryCard document={failed} onRetried={onRetried} />);

    await drop('abc');

    expect(await screen.findByRole('alert')).toHaveTextContent(/demorou demais/);
    expect(onRetried).not.toHaveBeenCalled();
  });
});
