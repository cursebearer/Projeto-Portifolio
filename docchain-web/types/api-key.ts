export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// A chave completa só vem na resposta de criação; depois disso não pode ser recuperada.
export interface CreatedApiKey extends ApiKeySummary {
  key: string;
}
