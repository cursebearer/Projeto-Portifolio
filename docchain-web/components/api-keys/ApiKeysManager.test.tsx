import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeysManager } from './ApiKeysManager';
import { createApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys';
import { httpError } from '@/test/fixtures';
import type { ApiKeySummary } from '@/types/api-key';

vi.mock('@/lib/api-keys', () => ({
  MAX_API_KEYS: 5,
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
}));
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function makeKey(overrides: Partial<ApiKeySummary> = {}): ApiKeySummary {
  return {
    id: 'k1',
    name: 'ERP do escritório',
    prefix: 'dc_live_abcd',
    createdAt: '2026-11-11T10:00:00.000Z',
    lastUsedAt: null,
    ...overrides,
  };
}

describe('ApiKeysManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as chaves só com o prefixo, nunca a chave inteira', async () => {
    vi.mocked(listApiKeys).mockResolvedValue([makeKey()]);
    render(<ApiKeysManager />);

    expect(await screen.findByText('ERP do escritório')).toBeInTheDocument();
    expect(screen.getByText('dc_live_abcd••••••••')).toBeInTheDocument();
    expect(screen.getByText('1 de 5 chaves ativas.')).toBeInTheDocument();
    expect(screen.getByText(/nunca usada/)).toBeInTheDocument();
  });

  it('sem chaves mostra estado vazio', async () => {
    vi.mocked(listApiKeys).mockResolvedValue([]);
    render(<ApiKeysManager />);

    expect(await screen.findByText('Você ainda não tem chaves de API.')).toBeInTheDocument();
  });

  it('gera a chave e mostra o valor completo uma única vez', async () => {
    vi.mocked(listApiKeys).mockResolvedValue([]);
    vi.mocked(createApiKey).mockResolvedValue({ ...makeKey(), key: 'dc_live_abcdSEGREDO123' });
    const user = userEvent.setup();
    render(<ApiKeysManager />);

    await user.click(await screen.findByRole('button', { name: /Gerar chave/ }));
    await user.type(screen.getByLabelText('Nome da chave'), '  ERP do escritório ');
    await user.click(screen.getByRole('button', { name: 'Gerar' }));

    expect(createApiKey).toHaveBeenCalledWith('ERP do escritório');
    expect(await screen.findByTestId('api-key-value')).toHaveTextContent('dc_live_abcdSEGREDO123');
    expect(screen.getByText('Copie sua chave agora')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Já copiei' }));
    await waitFor(() => expect(screen.queryByTestId('api-key-value')).not.toBeInTheDocument());
    expect(listApiKeys).toHaveBeenCalledTimes(2);
  });

  it('com 5 chaves o botão de gerar fica desabilitado', async () => {
    vi.mocked(listApiKeys).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => makeKey({ id: `k${i}`, name: `Chave ${i}` })),
    );
    render(<ApiKeysManager />);

    expect(await screen.findByText('Limite atingido. Revogue uma chave para gerar outra.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gerar chave/ })).toBeDisabled();
  });

  it('erro ao gerar mostra a mensagem da API', async () => {
    vi.mocked(listApiKeys).mockResolvedValue([]);
    vi.mocked(createApiKey).mockRejectedValue(httpError(409, 'Limite de 5 chaves ativas atingido.'));
    const user = userEvent.setup();
    render(<ApiKeysManager />);

    await user.click(await screen.findByRole('button', { name: /Gerar chave/ }));
    await user.type(screen.getByLabelText('Nome da chave'), 'X');
    await user.click(screen.getByRole('button', { name: 'Gerar' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Limite de 5 chaves ativas atingido.'));
  });

  it('revoga a chave após confirmar', async () => {
    vi.mocked(listApiKeys).mockResolvedValueOnce([makeKey()]).mockResolvedValueOnce([]);
    vi.mocked(revokeApiKey).mockResolvedValue();
    const user = userEvent.setup();
    render(<ApiKeysManager />);

    await user.click(await screen.findByRole('button', { name: 'Revogar chave ERP do escritório' }));
    await user.click(screen.getByRole('button', { name: 'Revogar chave' }));

    expect(revokeApiKey).toHaveBeenCalledWith('k1');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Chave revogada'));
    expect(await screen.findByText('Você ainda não tem chaves de API.')).toBeInTheDocument();
  });
});
