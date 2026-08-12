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
- [ ] `scripts/deploy.ts` — faz deploy e salva endereço + ABI em `artifacts/`
- [ ] `scripts/exportAbi.ts` — copia ABI para `../docchain-api/src/blockchain/abi/`
- [ ] `npx hardhat verify --network sepolia <ADDR>` — verificação Etherscan

### 1.4 Exportar para o backend
- [ ] Copiar ABI gerada para `docchain-api/src/blockchain/abi/DocumentRegistry.json`
- [ ] Salvar endereço do contrato em variável de ambiente `CONTRACT_ADDRESS`

### Critério de conclusão da Fase 1
```bash
npx hardhat test   # todos os testes passam
npx hardhat run scripts/deploy.ts --network sepolia   # tx confirmada, endereço salvo
```

---

## Fase 2 — Backend NestJS (5 dias)

**Objetivo:** API REST completa, funcional, com todos os fluxos testados via Postman/Insomnia.

### 2.1 Configuração base (dia 1)
- [ ] ConfigModule com validação de env vars (joi ou zod)
- [ ] PrismaModule global com PrismaService
- [ ] Migrations iniciais (tabelas `users`, `documents`, `audit_logs`, `verification_attempts`)
- [ ] Multer configurado para upload em memória (memoryStorage)
- [ ] Pasta `/uploads` mapeada como volume
- [ ] `cookie-parser` middleware registrado

### 2.2 AuthModule (dia 1-2)
- [ ] `POST /auth/register` — cria usuário com senha hasheada (bcrypt)
- [ ] `POST /auth/login` — valida credenciais, emite cookie httpOnly (`Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Max-Age=900`); **não retorna token no body**
- [ ] `POST /auth/logout` — `Set-Cookie: access_token=; Max-Age=0` (RF04)
- [ ] `GET /auth/me` — retorna { id, email, name, createdAt } (frontend hidrata Zustand; LGPD acesso)
- [ ] `PATCH /auth/me` — atualiza nome (LGPD correção; email imutável)
- [ ] `DELETE /auth/me` — elimina conta + arquivos cifrados + Documents (cascade) + anonimiza AuditLog/VerificationAttempt (LGPD eliminação)
- [ ] `GET /auth/me/export` — JSON User + Documents (LGPD portabilidade)
- [ ] JwtStrategy com `cookieExtractor` do Passport + JwtAuthGuard
- [ ] Decorador `@CurrentUser()` para extrair usuário do token

### 2.3 CryptoService (dia 2)
- [ ] `hashFile(buffer: Buffer): string` — SHA-256 hex
- [ ] `encrypt(buffer: Buffer): EncryptedPayload` — AES-256-GCM
- [ ] `decrypt(payload: EncryptedPayload): Buffer`
- [ ] Testes unitários do CryptoService

### 2.4 StorageModule (dia 2)
- [ ] Interface `IStorageService` (permite trocar Local por IPFS)
- [ ] `LocalStorageService` — salva/recupera arquivo em `/uploads/{hash}.enc`
- [ ] Testes do StorageService

### 2.5 BlockchainModule (dia 3)
- [ ] `BlockchainService` com Ethers.js
- [ ] Conecta ao contrato via ABI + endereço + RPC Sepolia
- [ ] `registerDocument(hash, storageRef)` — chama contrato + aguarda confirmação
- [ ] `verifyDocument(hash)` — lê contrato (view function, sem tx)
- [ ] Tratamento de erros: timeout, gas insuficiente, hash duplicado
- [ ] Testes de integração com contrato (pode usar fork local do Hardhat)

### 2.6 DocumentsModule (dia 3-4)
- [ ] `POST /documents` — fluxo completo de upload + AuditLog UPLOAD
- [ ] `GET /documents` — lista documentos do usuário (paginado, `deletedAt IS NULL`)
- [ ] `GET /documents/:id` — detalhe de um documento
- [ ] `DELETE /documents/:id` — soft-delete (`deletedAt = now()`) + remove arquivo cifrado + AuditLog DELETE (RF22-24)
- [ ] `POST /documents/verify` — verificação privada + VerificationAttempt PRIVATE
- [ ] `GET /verify/public/:hash` — verificação pública + validação regex `^[a-fA-F0-9]{64}$` antes de RPC (RF19, E07) + VerificationAttempt PUBLIC
- [ ] `GET /documents/:id/download` — arquivo descriptografado + AuditLog DOWNLOAD
- [ ] DTOs com validação (class-validator)
- [ ] Tratamento de erros com filtros globais

### 2.6b AuditLog + VerificationAttempt (dia 4)
- [ ] `AuditLogService` — método `log(action, userId?, ...)`
- [ ] `VerificationAttemptService` — método `record(hash, found, source, ...)`
- [ ] `RequestContextInterceptor` global — captura ipAddress + userAgent

### 2.7 Polish e documentação (dia 5)
- [ ] Swagger configurado (`@nestjs/swagger`)
- [ ] Health check endpoint `GET /health`
- [ ] Rate limiting básico (`@nestjs/throttler`)
- [ ] Logging estruturado
- [ ] Variáveis de ambiente todas documentadas no `.env.example`

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
| Fase 1 — Smart Contract | 2 dias | ⬜ Não iniciado |
| Fase 2 — Backend | 5 dias | ⬜ Não iniciado |
| Fase 3 — Frontend | 4 dias | ⬜ Não iniciado |
| Fase 4 — Integração | 2 dias | ⬜ Não iniciado |
| **Total** | **~14 dias úteis** | |

> Com sessões focadas de Claude Code, cada fase pode ser comprimida. O backend é a fase mais densa — reserve mais tempo se for a primeira vez com NestJS.
