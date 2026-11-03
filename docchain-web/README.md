# docchain-web

Interface web do DocChain.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, axios, Vitest + Testing Library.

## Setup

```bash
npm ci
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev -- -p 3001
```

Abre em http://localhost:3001. A API (`docchain-api`) precisa estar rodando em `NEXT_PUBLIC_API_URL`.

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`output: 'standalone'`, usado pelo `Dockerfile`) |
| `npm run lint` | ESLint |
| `npm test` | Testes com Vitest |
| `npm run test:cov` | Testes com cobertura (threshold 50%) |

`NEXT_PUBLIC_API_URL` entra no bundle em tempo de build. Na imagem Docker ela é passada como build arg.

## Telas

| Rota | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | pública | Landing |
| `/login`, `/register` | pública | Autenticação |
| `/dashboard` | logado | Lista, filtros, estatísticas e contador de versões |
| `/upload` | logado | Upload com progresso em etapas e aviso de arquivo já registrado |
| `/documents/[id]` | logado | Detalhe, Etherscan, download, versões, compartilhamento, comprovante PDF, exclusão |
| `/conta` | logado | Perfil, exportação de dados e exclusão de conta |
| `/verify`, `/verify/[hash]` | pública | Verificação por arquivo (hash calculado no navegador) ou por hash |
| `/termos`, `/privacidade` | pública | Termos de uso e política de privacidade |

O `proxy.ts` redireciona para `/login` quando não há cookie `access_token` em rota privada, e para `/dashboard` quando um usuário logado abre login ou cadastro.

## Estrutura

```
app/          rotas (App Router), grupos (auth) e (dashboard)
components/   componentes por área (dashboard, upload, document-detail, verify, landing, ui)
lib/          cliente da API, hash SHA-256 no navegador, formatação, etapas do upload
store/        estado global com Zustand (auth, documentos)
types/        tipos compartilhados com a API
proxy.ts      proteção de rotas por cookie
```
