import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PrivacyPage from '@/app/privacidade/page';
import TermsPage from '@/app/termos/page';

describe('páginas legais', () => {
  it('privacidade explica o que vai para a blockchain e aponta para Minha conta', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'O que vai para a blockchain' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/conta');
  });

  it('termos deixam claro o que a verificação não prova', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Termos de Uso' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(items.some((t) => t.includes('não substitui certificado digital ICP-Brasil'))).toBe(true);
  });

  it('rodapé público linka privacidade e termos', () => {
    render(<TermsPage />);
    const footer = screen.getByRole('navigation', { name: 'Rodapé' });
    expect(footer.querySelector('a[href="/privacidade"]')).not.toBeNull();
    expect(footer.querySelector('a[href="/termos"]')).not.toBeNull();
  });
});
