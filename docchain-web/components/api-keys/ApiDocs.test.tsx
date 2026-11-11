import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiDocs, swaggerUrl } from './ApiDocs';

describe('ApiDocs', () => {
  it('explica o header X-API-Key e lista só as rotas liberadas', () => {
    render(<ApiDocs />);

    expect(screen.getAllByText('X-API-Key').length).toBeGreaterThan(0);
    expect(screen.getByText('/documents/{id}')).toBeInTheDocument();
    expect(screen.queryByText(/DELETE/)).not.toBeInTheDocument();
  });

  it('lista os códigos de erro', () => {
    render(<ApiDocs />);

    for (const code of ['401', '403', '404', '409', '413', '429']) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });
});

describe('swaggerUrl', () => {
  it('local: porta da API + /api/docs', () => {
    expect(swaggerUrl('http://localhost:3000')).toBe('http://localhost:3000/api/docs');
  });

  it('produção: a API já está sob /api', () => {
    expect(swaggerUrl('https://docchain.exemplo.com/api')).toBe('https://docchain.exemplo.com/api/docs');
  });
});
