# Estratégia de Testes — DocChain

Referência para cobertura de testes ao longo do projeto. Alinha o desenvolvimento com o critério **obrigatório** do Portfolio Playbook (linha Web Apps):

> "Testes unitários com TDD: 75% no backend e 25% no frontend"
> — `directions/portfolio-directions-webapp.md`

---

## Meta de Cobertura por Repositório

| Repositório | Framework | Cobertura mínima | Escopo |
|---|---|---|---|
| `docchain-contracts` | Hardhat + Chai + ethers | **100% de branches** | Todas as funções, todos os revert paths, todos os eventos |
| `docchain-api` | Jest (nativo NestJS) | **75% statements / branches / lines / functions** | Services, guards, interceptors, filtros. Controllers via e2e |
| `docchain-web` | Vitest + React Testing Library | **25% statements / lines** | Componentes críticos, stores, hooks utilitários |

Cobertura medida via `--coverage`; relatório publicado no SonarCloud e no artifact do CI.

---

## Filosofia — TDD onde faz sentido

- **Contratos:** TDD estrito. Cada revert path escrito como teste antes da implementação. Blockchain é imutável — bug em produção não tem hotfix.
- **Backend:** TDD para regras de negócio (CryptoService, DocumentsService.create, VerificationService). Módulos de fronteira (Prisma, ethers, filesystem) mockados/stubbados em unit; validados em e2e.
- **Frontend:** TDD relaxado — testes escritos junto ou depois do componente. Foco em: stores Zustand, hooks, componentes com lógica condicional (StatusBadge, VerificationResult, UploadProgress).

---

## O que testar em cada camada

### Smart Contracts (`docchain-contracts`)

**Happy path**
- Registro bem-sucedido de documento
- Evento `DocumentRegistered` emitido com argumentos corretos
- Contador `totalDocuments` incrementa
- `verifyDocument` retorna registro completo
- `isRegistered` retorna booleano correto

**Revert paths (todos)**
- `InvalidHash` — bytes32 zerado
- `EmptyStorageRef` — string vazia
- `DocumentAlreadyRegistered` — hash duplicado

**Edge cases**
- Registro por endereço distinto do owner
- Leitura de hash inexistente retorna struct zerado com `exists=false`

### Backend (`docchain-api`)

**Unit tests (Jest — `.spec.ts` ao lado do arquivo)**

| Módulo | O que cobrir |
|---|---|
| `CryptoService` | hashFile determinístico, encrypt/decrypt round-trip, IV único por chamada, tampering detectado (authTag) |
| `LocalStorageService` | save gera path esperado, retrieve retorna Buffer, retrieve de arquivo inexistente lança erro |
| `BlockchainService` | conversão hex→bytes32, registerDocument chama contrato, verifyDocument mapeia struct pra DTO, tratamento de `DocumentAlreadyRegistered` |
| `AuthService` | register hasheia com bcrypt, login rejeita senha errada, JWT gerado com payload correto |
| `DocumentsService` | fluxo completo com todos os steps mockados, rollback em falha de blockchain, paginação, filtro por status, soft-delete |
| `AuditLogService` | log grava registro correto, anonimização em DELETE user |
| `JwtStrategy` | cookieExtractor lê `access_token`, valida payload |
| `HttpExceptionFilter` | formata erros no shape esperado |

**Integration / e2e tests (`test/*.e2e-spec.ts`)**
- `POST /auth/register` → 201 + user criado
- `POST /auth/login` → cookie httpOnly emitido
- `POST /documents` (arquivo real) → CONFIRMED + tx_hash preenchido (contra Hardhat local fork)
- `GET /documents` protegido — 401 sem cookie
- `GET /verify/public/:hash` — 200 público, valida regex

**Excluído da cobertura:** `main.ts`, `*.module.ts`, migrations, seed.

### Frontend (`docchain-web`)

**Componentes com lógica**
- `StatusBadge` — cor correta por status
- `VerificationResult` — renderiza autêntico vs falho
- `UploadProgress` — transições de estado
- `DocumentTable` — paginação, empty state

**Stores/hooks**
- `auth.store` — login/logout mutam estado
- `documents.store` — cache invalidation

**Excluído:** páginas puramente compositivas, componentes shadcn/ui puros, layouts.

---

## Ferramentas e configuração

### Contracts
- `hardhat-toolbox` já inclui chai-matchers e ethers-v6
- Cobertura via `solidity-coverage` (npm i -D solidity-coverage) — comando `npx hardhat coverage`

### Backend
- Jest nativo NestJS (`npm run test:cov`)
- Threshold configurado em `jest.config.js`:
  ```js
  coverageThreshold: {
    global: { branches: 75, functions: 75, lines: 75, statements: 75 }
  },
  coveragePathIgnorePatterns: ['/node_modules/', 'main.ts', '.module.ts', 'prisma/']
  ```
- Prisma mockado via `jest-mock-extended`

### Frontend
- Vitest + `@testing-library/react` + `@testing-library/jest-dom`
- Threshold em `vitest.config.ts`:
  ```ts
  coverage: {
    thresholds: { lines: 25, statements: 25 },
    exclude: ['app/**/layout.tsx', 'app/**/loading.tsx', 'components/ui/**']
  }
  ```

---

## Gates de CI

Pipeline GitHub Actions bloqueia merge se:
- Qualquer teste falha
- Cobertura cai abaixo do threshold do repositório
- Lint quebra
- SonarCloud reporta bug bloqueante ou vulnerabilidade

---

## Alinhamento com Fases do ROADMAP

- **Fase 1** — testes de contrato escritos junto com o `.sol` (feito)
- **Fase 2** — cada módulo do backend entregue com sua suite `.spec.ts` (nunca fechar sessão sem teste)
- **Fase 3** — testes de componente escritos por PR, não ao final
- **Fase 4** — rodar coverage completo, publicar badge no README, garantir threshold antes do release

---

## Referências

- Portfolio Playbook — `directions/portfolio-directions-webapp.md`
- Contrato Pedagógico Portfolio + PAC VIII (2026/2)
- RFC DocChain 1.2 — seção Requisitos Não-Funcionais
