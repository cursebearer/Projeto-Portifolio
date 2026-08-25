# Roadmap de Desenvolvimento — DocChain

## Visão Geral das Fases

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
  Setup   Contrato  Backend  Frontend  Integração
  (1d)    (2d)      (5d)     (4d)      (2d)
                                        ↓
                                    TCC Entregue
```

---

## Fase 0 — Setup e Infraestrutura (1 dia) ✅ CONCLUÍDA

**Objetivo:** Ambiente de desenvolvimento 100% funcional antes de escrever qualquer código de produto.

### 0.1 Criar repositórios
- [x] `docchain-contracts` — inicializar com Hardhat
- [x] `docchain-api` — inicializar com NestJS CLI
- [x] `docchain-web` — inicializar com Next.js 14 (App Router)

### 0.2 Docker Compose base
- [x] Serviço `postgres` com volume persistente
- [x] Serviço `api` apontando para `docchain-api`
- [x] `.env.example` em cada repositório com todas as variáveis necessárias

### 0.3 Configuração inicial de cada repo
- [x] TypeScript strict mode em todos
- [x] ESLint + Prettier configurados
- [x] Prisma inicializado no `docchain-api` com conexão ao PostgreSQL do Docker
- [x] Hardhat configurado com rede Sepolia (via Infura/Alchemy)

### Critério de conclusão da Fase 0
```bash
docker compose up -d   # postgres sobe sem erro
cd docchain-api && npx prisma db push   # schema aplicado sem erro
cd docchain-contracts && npx hardhat compile   # compila sem erro
cd docchain-web && npm run dev   # Next.js sobe sem erro
```

---

## Fase 1 — Smart Contract (2 dias)

**Objetivo:** Contrato `DocumentRegistry` deployed na Sepolia, testado, com ABI exportada.

Cobertura de testes segue [TESTING_STRATEGY.md](TESTING_STRATEGY.md) — contratos exigem 100% de branches.

### 1.1 Escrever o contrato
- [x] `contracts/DocumentRegistry.sol`
  - Struct `DocumentRecord`
  - Mapping `bytes32 → DocumentRecord`
  - Evento `DocumentRegistered`
  - Função `registerDocument(bytes32 hash, string calldata storageRef)`
  - Função `verifyDocument(bytes32 hash) view`
  - Erros customizados: `InvalidHash`, `DocumentAlreadyRegistered`, `EmptyStorageRef` (imutabilidade garantida)

### 1.2 Testes do contrato
- [x] `test/DocumentRegistry.test.ts` — 13 testes passando
  - Deve registrar documento com sucesso
  - Deve emitir evento `DocumentRegistered`
  - Deve reverter ao tentar registrar hash duplicado
  - Deve retornar dados corretos em `verifyDocument`
  - Deve retornar `exists: false` para hash inexistente
  - Deploy: owner + totalDocuments zero
  - isRegistered antes/depois
  - Registro por conta distinta do owner

### 1.3 Script de deploy
- [x] `scripts/deploy.ts` — faz deploy e salva metadata em `deployments/<network>.json`
- [x] `scripts/exportAbi.ts` — copia ABI para `../docchain-api/src/blockchain/abi/`
- [x] `npx hardhat verify --network sepolia <ADDR>` — verificação Etherscan

### 1.4 Exportar para o backend
- [x] Copiar ABI gerada para `docchain-api/src/blockchain/abi/DocumentRegistry.json`
- [x] Salvar endereço do contrato em variável de ambiente `CONTRACT_ADDRESS`

### ✅ Fase 1 concluída (2026-08-12)

- **Contrato deployed:** [`0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e`](https://sepolia.etherscan.io/address/0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e#code)
- **Rede:** Sepolia (chainId 11155111)
- **Tx hash:** `0x8f4feb4f02ef810dd3762c7d99290c18c662811654ce9eb644f3f17bf3e8a09d`
- **Testes:** 13 passing, cobertura 100% (statements / branches / funcs / lines)
- **ABI publicada:** `docchain-api/src/blockchain/abi/DocumentRegistry.json`
- **Metadata deploy:** `docchain-contracts/deployments/sepolia.json`
- **Etherscan verify:** ✔ código-fonte publicado no explorer

### Critério de conclusão da Fase 1
```bash
npx hardhat test   # todos os testes passam
npx hardhat run scripts/deploy.ts --network sepolia   # tx confirmada, endereço salvo
```

---

## Fase 2 — Backend NestJS (5 dias)

**Objetivo:** API REST completa, funcional, com todos os fluxos testados via Postman/Insomnia.

### 2.1 Configuração base (dia 1) ✅
- [x] ConfigModule com validação de env vars (joi)
- [x] PrismaModule global com PrismaService
- [x] Migrations iniciais (tabelas `users`, `documents`, `audit_logs`, `verification_attempts`)
- [x] Multer configurado para upload em memória (memoryStorage) — via `MulterModule.registerAsync` no `DocumentsModule` (Sessão 4a)
- [ ] Pasta `/uploads` mapeada como volume — Sessão 2
- [x] `cookie-parser` middleware registrado
- [x] `ValidationPipe` global (whitelist + forbidNonWhitelisted + transform)
- [x] Volume `uploads_data` declarado no `docker-compose.yml` (Sessão 2)

### 2.2 AuthModule (dia 1-2) — parcial
- [x] `POST /auth/register` — cria usuário com senha hasheada (bcrypt 10 rounds)
- [x] `POST /auth/login` — valida credenciais, emite cookie httpOnly (`Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax; Max-Age=900`); **não retorna token no body**
- [x] `POST /auth/logout` — `Set-Cookie: access_token=; Max-Age=0` (RF04)
- [x] `GET /auth/me` — retorna { id, email, name, createdAt } (frontend hidrata Zustand; LGPD acesso)
- [ ] `PATCH /auth/me` — atualiza nome (LGPD correção; email imutável) — pendente
- [ ] `DELETE /auth/me` — elimina conta + arquivos cifrados + Documents (cascade) + anonimiza AuditLog/VerificationAttempt (LGPD eliminação) — pendente (depende de StorageService)
- [ ] `GET /auth/me/export` — JSON User + Documents (LGPD portabilidade) — pendente (depende de DocumentsModule)
- [x] JwtStrategy com `cookieExtractor` do Passport + JwtAuthGuard
- [x] Decorador `@CurrentUser()` para extrair usuário do token

### 2.3 CryptoService (dia 2) ✅
- [x] `hashFile(buffer: Buffer): string` — SHA-256 hex
- [x] `encrypt(buffer: Buffer): EncryptedPayload` — AES-256-GCM
- [x] `decrypt(payload: EncryptedPayload): Buffer`
- [x] `serializePayload` / `deserializePayload` (formato `iv|authTag|ciphertext`)
- [x] Testes unitários do CryptoService — 17 testes, 100% statements

### 2.4 StorageModule (dia 2) ✅
- [x] Interface `IStorageService` + token DI `STORAGE_SERVICE` (permite trocar Local por IPFS)
- [x] `LocalStorageService` — save / retrieve / delete / exists em `${UPLOAD_DIR}/{hash}.enc`
- [x] Validação regex hash SHA-256 (bloqueia path traversal)
- [x] Testes do StorageService — 13 testes, 100% statements

### 2.5 BlockchainModule (dia 3) ✅
- [x] `BlockchainService` com Ethers.js v6
- [x] Conecta ao contrato via ABI + endereço + RPC Sepolia (Provider/Signer/Contract in-service)
- [x] `registerDocument(hash, storageRef)` — chama contrato + aguarda `tx.wait()` (1 confirmação)
- [x] `verifyDocument(hash)` — lê contrato (view function, sem tx)
- [x] `isRegistered(hash)` (bônus — pre-check antes de tx)
- [x] Error mapping: `DocumentAlreadyRegistered → Conflict`, `InvalidHash/EmptyStorageRef → BadRequest`, genérico → `InternalServerError` com Logger
- [x] Conversão hex → bytes32 + validação regex `^[a-fA-F0-9]{64}$`
- [x] 17 testes unit (ethers mockado) — 97.87% stmts / 87.5% branch
- [ ] Testes de integração com contrato (Hardhat fork ou Sepolia real) — deferido pra Sessão 5

### 2.6 DocumentsModule (dia 3-4)

**2.6a — Core CRUD (Sessão 4a) ✅**
- [x] `POST /documents` — fluxo síncrono hash → encrypt → save → register → CONFIRMED
- [x] `GET /documents` — paginado + filtro status + `deletedAt IS NULL`
- [x] `GET /documents/:id` — 404 se não é dono (evita vazar existência)
- [x] `DELETE /documents/:id` — soft-delete + apaga `.enc` (idempotente)
- [x] `GET /documents/:id/download` — decrypt + headers (só se status CONFIRMED)
- [x] `ListDocumentsQueryDto` (class-validator + class-transformer)
- [x] Rollback: falha em storage/blockchain marca FAILED + apaga file + rethrow
- [ ] AuditLog UPLOAD/DELETE/DOWNLOAD — **Sessão 4b**

**2.6b — Verify + Audit (Sessão 4b) ✅**
- [x] `POST /documents/verify` — verificação privada + VerificationAttempt PRIVATE
- [x] `GET /verify/public/:hash` — pública + regex `^(0x)?[a-fA-F0-9]{64}$` antes de RPC (RF19, E07) + VerificationAttempt PUBLIC
- [x] `AuditLogService.log(action, userId?, ...)` — não bloqueia fluxo (warn no fail)
- [x] `VerificationAttemptService.record(hash, found, source, ...)` — idem
- [x] `RequestContextInterceptor` global via `AsyncLocalStorage` (sem dep externa) — captura ip + userAgent + userId
- [x] Retro-instrumentar endpoints da 4a com AuditLog UPLOAD/DELETE/DOWNLOAD
- [ ] AuditLog LOGIN/LOGOUT/REGISTER — **Sessão 5** (instrumentar AuthController)

### 2.6b AuditLog + VerificationAttempt (dia 4) ✅ (feito na Sessão 4b)

### 2.7 Polish e documentação (dia 5) ✅
- [x] Swagger configurado (`@nestjs/swagger`) em `/api/docs` — cookie auth `access_token`
- [x] Health check endpoint `GET /health` (DB via `SELECT 1` + blockchain via `getBlockNumber` com timeout 5s)
- [x] Rate limiting global (`@nestjs/throttler`) — 100 req/min padrão, mais restrito em `/auth/login` (10/min), `/auth/register` (5/min), `/verify/public/:hash` (30/min), `/health` skip
- [x] Logging estruturado — níveis via `LOG_LEVEL` env (verbose|debug|log|warn|error|fatal)
- [x] Variáveis de ambiente todas documentadas no `.env.example` (+ LOG_LEVEL, THROTTLE_*)
- [x] Ativar `coverageThreshold` no `jest.config.ts` (75% stmts/branches/lines/funcs)
- [x] `coveragePathIgnorePatterns` para `*.module.ts`, `main.ts`, `storage.interface.ts`, `dto/`, `decorators/`, `guards/`, `strategies/`, `blockchain/abi/`
- [x] **BlockchainService — pendências RFC:**
  - [x] Timeout explícito em `tx.wait()` (RNF02 cap 30s Sepolia) → `RequestTimeoutException`
  - [x] Balance check do signer antes de tx (warn se < 0.001 ETH)
  - [ ] Event parser opcional de `DocumentRegistered` — decidido não implementar (2ª call `verifyDocument` já cobre e é mais explícita)
  - [ ] Teste de integração real contra Sepolia OU Hardhat fork — **deferido pra Fase 4** (integração)
- [ ] E2E `.e2e-spec.ts` do fluxo completo POST /documents → CONFIRMED — **deferido pra Fase 4** (precisa Sepolia real ou Hardhat fork rodando)

### Critério de conclusão da Fase 2
```
Via Postman/Insomnia, executar o fluxo completo:
1. POST /auth/register → 201
2. POST /auth/login → access_token
3. POST /documents (com arquivo) → status CONFIRMED, tx_hash preenchido
4. GET /documents → lista com o documento
5. POST /documents/verify (mesmo arquivo) → hashMatch: true, blockchainConfirmed: true
6. POST /documents/verify (arquivo alterado) → hashMatch: false
```

### 🚧 Fase 2 Sessão 1 concluída (2026-08-18)

- **Prisma schema:** 4 models (User, Document, AuditLog, VerificationAttempt) + 4 enums, migration `20260818043522_init` aplicada
- **PrismaModule:** global, connect/disconnect no lifecycle
- **AuthModule:** register / login / logout / me — cookie httpOnly + JWT + bcrypt + JwtStrategy (cookie extractor)
- **10 testes E2E via curl verdes:** 201/409/400/400/200+cookie/401/200/401/204/401
- **Ajuste técnico:** downgrade Prisma 7.6 → 6.19 (v7 exige adapter novo, incompatível com nossa spec)

### 🚧 Fase 2 Sessão 2 concluída (2026-08-24)

- **CryptoModule:** `CryptoService` global — SHA-256 hex + AES-256-GCM (IV 12B, authTag 16B) + serialize/deserialize (`iv|authTag|ciphertext`)
- **StorageModule:** interface `IStorageService` + token `STORAGE_SERVICE` (troca Local↔IPFS futura) + `LocalStorageService` (save/retrieve/delete/exists em `${UPLOAD_DIR}/{hash}.enc`)
- **Segurança:** validação regex `^[a-f0-9]{64}$` no `LocalStorageService` bloqueia path traversal
- **Volume Docker:** `uploads_data` declarado no `docker-compose.yml`
- **Backfill Sessão 1:** `auth.service.spec.ts`, `auth.controller.spec.ts`, `jwt.strategy.spec.ts`, `prisma.service.spec.ts`, `current-user.decorator.spec.ts`, `jwt-auth.guard.spec.ts` — décidido tirar o débito antes da Sessão 3
- **Testes:** 64 unitários verdes — cobertura global **79.33% stmts / 83% branch / 94.73% funcs / 81.04% lines** (bate meta 75% do TESTING_STRATEGY)
- **Ajustes técnicos:**
  - `serializePayload` retorna Buffer único (header fixo 28B)
  - `bcrypt` mockado via `jest.mock` (não `spyOn`: bcrypt.compare é readonly export)
  - `cookieExtractor` e `extractCurrentUser` extraídos como exports pra permitir teste unitário
- **Débito remanescente (Sessão 5):** ativar `coverageThreshold` + configurar `coveragePathIgnorePatterns`

### 🚧 Fase 2 Sessão 3 concluída (2026-08-24)

- **BlockchainModule (global):** `BlockchainService` com ethers.js v6
- **Endpoints do contrato usados:** `registerDocument` / `verifyDocument` / `isRegistered` (os 3 do ABI que a API precisa)
- **Endpoints não usados (proposital):** `owner()`, `totalDocuments()` — governança e métrica admin, fora do escopo TCC
- **Injeção:** Provider/Signer/Contract construídos in-service via `ConfigService` (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)
- **Error mapping:** `DocumentAlreadyRegistered → ConflictException` (RF10), `InvalidHash`/`EmptyStorageRef → BadRequestException`, genérico → `InternalServerErrorException` com `Logger`
- **Bytes32:** aceita hash com/sem prefix `0x`, normaliza lowercase, valida regex antes de chamar contrato
- **Testes:** 17 unit verdes com `ethers` mockado — cobertura 97.87% stmts / 87.5% branch / 100% funcs
- **Suite total:** 81 testes verdes (10 suites) — cobertura global mantém acima de 75%
- **Ajustes técnicos:**
  - Mock do módulo `ethers` via `jest.mock` — expõe `__contractInstance` compartilhado
  - Tests `it.each` cobrem os 3 envs obrigatórios (RPC/PRIVATE_KEY/ADDRESS)

### 🚧 Fase 2 Sessão 4a concluída (2026-08-24)

- **DocumentsModule:** `DocumentsService` + `DocumentsController` + `ListDocumentsQueryDto`
- **Multer:** `MulterModule.registerAsync` com `memoryStorage()` + limite `MAX_FILE_SIZE_MB` (default 50)
- **Fluxo POST /documents (síncrono, RNF02 <30s):**
  1. `crypto.hashFile(buffer)` → SHA-256
  2. Pré-check duplicata em Prisma (`Document.hash @unique`) — reject 409 antes de gastar gas
  3. Cria row `status=PROCESSING`
  4. `crypto.encrypt` + `serializePayload` → 1 arquivo `.enc` (iv|authTag|ciphertext)
  5. `storage.save(hash, buffer)` → storageRef
  6. Grava iv/authTag em base64 no row
  7. `blockchain.registerDocument(hash, storageRef)` + `tx.wait()`
  8. Row → `CONFIRMED` com txHash, blockNumber, walletAddress, confirmedAt
  9. Falha em qualquer step: rollback (delete file idempotente) + `status=FAILED` + errorMessage + rethrow
- **Ownership:** `findFirst({ id, userId, deletedAt: null })` — 404 unificado (não vaza existência)
- **Soft-delete:** RF22-24 — `deletedAt = now()` + apaga arquivo, on-chain permanece imutável
- **Download:** só se `status=CONFIRMED` — retrieve → deserialize → decrypt → send com `Content-Disposition` encoded
- **BlockchainService:** exposto `signerAddress` (via `Wallet.address`) — grava em `Document.walletAddress`
- **Testes:** 27 novos (17 service + 10 controller) — coverage `documents.service.ts` 100% stmts / 78.94% branch
- **Suite total:** 108 testes verdes (12 suites) — global 82.61% stmts / 76.92% branch / 91.66% funcs / 84.65% lines
- **Ajustes técnicos:**
  - `import type` obrigatório em `AuthenticatedUser` e `IStorageService` (isolatedModules + emitDecoratorMetadata)
  - `ParseUUIDPipe` no `:id` bloqueia UUID inválido antes do service

### 🚧 Fase 2 Sessão 4b concluída (2026-08-24)

- **CommonModule (global):** `RequestContextService` (AsyncLocalStorage built-in) + `RequestContextInterceptor` registrado via `APP_INTERCEPTOR` — captura ip + userAgent + userId em todo request
  - Zero dependência externa (sem `nestjs-cls` etc.)
  - `runObservable()` propaga contexto pra cadeia RxJS
- **AuditModule (global):** `AuditLogService.log({ action, userId?, resourceType?, resourceId?, metadata? })`
  - Lê ip/userAgent/userId do contexto; explícito sobrescreve (`null` explícito = ação anônima)
  - `try/catch` interno — falha ao gravar log não derruba operação principal (warn log)
- **VerificationModule:** `VerificationAttemptService.record()` mesma pattern do audit
- **VerifyController:**
  - `POST /documents/verify` (JWT) → PRIVATE attempt com userId
  - `GET /verify/public/:hash` (sem auth) → PUBLIC attempt com userId=null
  - Validação regex `^(0x)?[a-fA-F0-9]{64}$` via DTO antes de chegar ao service
- **DocumentsService retro-instrumentado:** UPLOAD (pós-CONFIRMED), DELETE (pós-soft-delete), DOWNLOAD (pós-decrypt) — metadata `{ hash, fileName, txHash?, blockNumber? }`
- **Testes:** 19 novos (5 request-ctx + 2 interceptor + 4 audit + 4 verification-attempt + 3 verify.ctrl + 3 updates DocumentsService) — suite total **127 verdes** (17 suites)
- **Coverage global:** 81.89% stmts / 79.53% branch / 93.33% funcs / 84.13% lines
- **Ajustes técnicos:**
  - `opts.userId !== undefined` (não `??`) pra permitir `null` explícito
  - `VerifyController` sem prefix (`@Controller()`) porque endpoints ficam em paths diferentes (`documents/verify` e `verify/public/:hash`)
- **Débito Sessão 5:** AuditLog para LOGIN/LOGOUT/REGISTER (instrumentar AuthController)

### 🎯 Fase 2 Sessão 5 concluída (2026-08-25)

- **Swagger:** `SwaggerModule` em `/api/docs` — cookie auth `access_token`, tags `auth`/`documents`/`verification`/`health`, decorators `@ApiProperty` nos DTOs, `@ApiConsumes('multipart/form-data')` no upload
- **HealthModule:** `HealthController` + `HealthService` — checa Prisma (`$queryRaw`SELECT 1``) + `BlockchainService.getBlockNumber()` (timeout 5s), retorna `200 ok` ou `503 degraded` com detail por check, `@SkipThrottle()`
- **Throttler global:** `APP_GUARD` = `ThrottlerGuard`; TTL/limit via env (`THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`); overrides `@Throttle` em endpoints sensíveis
- **BlockchainService hardening:**
  - `TX_WAIT_TIMEOUT_MS = 30_000` (RNF02) + método `withTimeout()` genérico → `RequestTimeoutException`
  - `assertSufficientBalance()` pré-tx — warn se saldo < 0.001 ETH (não bloqueia, RPC pode falhar)
  - `getBlockNumber()` público pro health check (com mesmo timeout wrapper)
- **AuditLog auth:** `AuthService.register/login` grava REGISTER/LOGIN success/failure com metadata (`success`, `reason`); `AuthController.logout` grava LOGOUT
- **Logging estruturado:** `LOG_LEVEL` env aplicado via `resolveLogLevels()` em `bootstrap` (`main.ts`)
- **Jest config extraído** de `package.json` → `jest.config.ts`; `coverageThreshold` 75% ativo; `coveragePathIgnorePatterns` exclui módulos, DTOs, decorators, guards, strategies, ABIs
- **`.env.example`:** adicionados `LOG_LEVEL`, `THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`; Joi validation atualizada
- **Testes:** 14 novos (4 health.service + 1 health.ctrl + 4 auth.service audit + 1 auth.ctrl logout + 2 blockchain balance + 1 blockchain getBlockNumber + 1 blockchain timeout) — suite total **141 verdes** (19 suites)
- **Coverage global (com ignorePatterns):** **99.53% stmts / 80.07% branch / 100% funcs / 99.74% lines** — bate threshold 75%
- **Ajustes técnicos:**
  - Fake timers + `advanceTimersByTimeAsync` + handler `.catch` antecipado pra testar timeout tx.wait sem `PromiseRejectionHandledWarning`
  - `AuditLogService` já era global — só injetar em `AuthService`/`AuthController`
  - `SkipThrottle` no health evita 429 durante monitoring
- **Deferido Fase 4:** E2E completo POST /documents → CONFIRMED (precisa Sepolia/Hardhat fork), event parser DocumentRegistered (2ª call verifyDocument já cobre)

---

## Fase 3 — Frontend Next.js (4 dias)

**Objetivo:** Interface funcional para todas as operações do sistema.

### 3.1 Setup e layout base (dia 1)
- [ ] Tailwind CSS + shadcn/ui configurados
- [ ] Layout raiz com sidebar/navbar
- [ ] Rotas protegidas com middleware Next.js (redireciona para /login se sem token)
- [ ] API client configurado (axios ou fetch wrapper com interceptors JWT)

### 3.2 Autenticação (dia 1)
- [ ] Página `/login` — formulário email + senha
- [ ] Página `/register` — formulário de cadastro
- [ ] axios configurado com `withCredentials: true` (cookie enviado automaticamente)
- [ ] Zustand store guarda apenas user metadata; hidrata via `GET /auth/me` após login
- [ ] Logout via `POST /auth/logout` (backend apaga cookie)

### 3.3 Dashboard (dia 2)
- [ ] Página `/dashboard` — lista de documentos do usuário
  - Tabela com: nome, hash (truncado), status, data, ações
  - Badges de status: PENDING (amarelo), CONFIRMED (verde), FAILED (vermelho)
  - Link para detalhe
  - Botão de upload rápido
- [ ] Cards de estatísticas: total documentos, confirmados, pendentes

### 3.4 Upload (dia 2)
- [ ] Página `/upload`
  - Dropzone para seleção de arquivo
  - Preview de nome e tamanho
  - Feedback de progresso durante processamento
  - Estados: idle → uploading → processing → confirmed/error
  - Exibe hash gerado e tx_hash após confirmação

### 3.5 Detalhe do documento (dia 3)
- [ ] Página `/documents/[id]`
  - Todos os metadados do documento
  - Link para tx no Etherscan Sepolia (abre em nova aba)
  - Botão "Verificar Integridade" — abre dropzone inline
  - Resultado da verificação com ícone visual (check verde / x vermelho)
  - Botão de download (arquivo descriptografado)
  - Botão "Excluir" → AlertDialog com aviso "registro on-chain permanece imutável" → `DELETE /documents/:id` (RF22-24)

### 3.6 Verificação pública (dia 3-4)
- [ ] Página `/verify` — verificação sem autenticação
  - Campo para colar hash SHA-256
  - OU upload de arquivo para recalcular hash
  - Consulta blockchain e retorna resultado público
  - Útil para terceiros verificarem autenticidade

### 3.7 Polish (dia 4)
- [ ] Loading states em todas as operações assíncronas
- [ ] Error handling com toasts (sonner ou react-hot-toast)
- [ ] Responsividade mobile
- [ ] Empty states (sem documentos ainda)
- [ ] Favicon e metadados básicos

### Critério de conclusão da Fase 3
```
Executar o fluxo completo via browser:
1. Registrar → Login → Upload arquivo → Ver confirmação blockchain
2. Acessar dashboard → Ver documento listado
3. Acessar detalhe → Clicar em verificar → Fazer upload do mesmo arquivo → Ver "Autêntico"
4. Fazer upload de arquivo modificado → Ver "Falha na verificação"
5. Acessar /verify sem login → Verificar por hash
```

---

## Fase 4 — Integração, Testes Finais e Documentação (2 dias)

**Objetivo:** Sistema estável, documentado e pronto para apresentação do TCC.

### 4.1 Integração end-to-end (dia 1)
- [ ] Docker Compose com todos os serviços (postgres + api + web)
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Seed de dados para demonstração
- [ ] Testar fluxo completo no ambiente containerizado

### 4.2 Documentação do TCC (dia 2)
- [ ] README de cada repositório com instruções de setup
- [ ] Diagrama de arquitetura (exportar versão visual de ARCHITECTURE.md)
- [ ] Documentação do Smart Contract (NatSpec no Solidity)
- [ ] Swagger disponível em /api/docs
- [ ] Slide/resumo técnico para apresentação

---

## Estimativa Total

| Fase | Tempo | Status |
|---|---|---|
| Fase 0 — Setup | 1 dia | ✅ Concluída |
| Fase 1 — Smart Contract | 2 dias | ✅ Concluída |
| Fase 2 — Backend | 5 dias | 🚧 Em andamento (Sessão 4b/5) |
| Fase 3 — Frontend | 4 dias | ⬜ Não iniciado |
| Fase 4 — Integração | 2 dias | ⬜ Não iniciado |
| **Total** | **~14 dias úteis** | |

> Com sessões focadas de Claude Code, cada fase pode ser comprimida. O backend é a fase mais densa — reserve mais tempo se for a primeira vez com NestJS.
