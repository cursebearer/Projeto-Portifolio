# Arquitetura do Sistema — DocChain

## Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USUÁRIO (Browser)                            │
│                         docchain-web (Next.js)                          │
│  /login  /dashboard  /upload  /documents/[id]  /verify                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / REST API
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        docchain-api (NestJS)                             │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  AuthModule  │  │  Documents   │  │  Blockchain  │  │  Storage   │  │
│  │  JWT/Passport│  │  Module      │  │  Module      │  │  Module    │  │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│                           │                 │                │         │
│                    ┌──────▼─────────────────▼────────────────▼──────┐   │
│                    │              Prisma ORM                        │   │
│                    └──────────────────────┬─────────────────────────┘   │
└───────────────────────────────────────────┼─────────────────────────────┘
                                            │
              ┌─────────────────────────────┼──────────────────────────┐
              │                             │                          │
              ▼                             ▼                          ▼
   ┌─────────────────────────┐  ┌──────────────────────┐    ┌────────────────────┐
   │     PostgreSQL          │  │  Storage Local        │    │  Sepolia Testnet   │
   │     (metadados)         │  │  /uploads/*.enc        │    │  (Smart Contract)  │
   │                         │  │                        │    │                    │
   │  users                  │  │  Futuro: IPFS/Kubo    │    │  DocumentRegistry  │
   │  documents (soft-del.)  │  │  localhost:5001        │    │  Solidity          │
   │  audit_logs (LGPD)      │  │                        │    │                    │
   │  verification_attempts  │  │                        │    │                    │
   │  document_shares (2.8)  │  │                        │    │                    │
   └─────────────────────────┘  └──────────────────────┘    └────────────────────┘

Módulos adicionais (Fase 2.8):
  SharingModule + MailerModule + PdfModule → provider SMTP externo (Resend/SendGrid)
```

---

## Repositórios e Responsabilidades

### `docchain-contracts` (Hardhat + Solidity)
- Único Smart Contract: `DocumentRegistry.sol`
- Deploy na Sepolia via Hardhat scripts
- Exporta ABI + endereço do contrato para uso no backend
- **Não tem servidor** — é um projeto de tooling/deploy

### `docchain-api` (NestJS)
- API REST consumida pelo frontend
- Orquestra todo o fluxo: recebe arquivo → hash → criptografia → storage → blockchain → banco
- Usa Ethers.js para interagir com o contrato deployed
- Usa Prisma para persistência
- Expõe endpoints documentados (ver `API_SPEC.md`)

### `docchain-web` (Next.js 14)
- Interface do usuário
- App Router com Server Components onde possível
- Consome a API do `docchain-api`
- Não interage diretamente com blockchain (tudo passa pela API)

---

## Módulos do Backend (NestJS)

### AuthModule
```
Responsabilidade: autenticação e autorização via cookie httpOnly
Dependências: @nestjs/passport, @nestjs/jwt, bcrypt, cookie-parser
Expõe: POST /auth/register, POST /auth/login, POST /auth/logout,
       GET /auth/me, PATCH /auth/me, DELETE /auth/me, GET /auth/me/export
Guards: JwtAuthGuard (aplicado globalmente nas rotas protegidas)

Fluxo de auth:
  - POST /auth/login → valida credenciais → Set-Cookie: access_token (HttpOnly, Secure, SameSite=Lax, Max-Age=900)
  - JwtStrategy usa cookieExtractor (Passport) para ler o JWT do cookie, não do header Authorization
  - POST /auth/logout → Set-Cookie: access_token=; Max-Age=0 (apaga)
  - GET /auth/me → retorna { id, email, name, createdAt } (frontend hidrata Zustand; LGPD Art. 18 acesso)
  - PATCH /auth/me → atualiza name (LGPD Art. 18 correção; email imutável)
  - DELETE /auth/me → elimina conta + arquivos cifrados + Documents (cascade) + anonimiza AuditLog/VerificationAttempt (userId=NULL); on-chain permanece como hash órfão (LGPD Art. 18 eliminação)
  - GET /auth/me/export → JSON com User + Documents para portabilidade (LGPD Art. 18 portabilidade)
```

### DocumentsModule
```
Responsabilidade: orquestrar o fluxo completo do documento
Dependências: StorageModule, BlockchainModule, CryptoService, PrismaService, AuditLogService
Expõe: POST /documents, GET /documents, GET /documents/:id,
       DELETE /documents/:id, POST /documents/verify, GET /documents/:id/download,
       GET /verify/public/:hash,
       POST /documents/:id/versions, GET /documents/:id/versions  (Fase 2.9)
Fluxo interno (upload):
  1. Recebe multipart/form-data
  2. Chama CryptoService.hash(buffer)
  3. Chama CryptoService.encrypt(buffer)
  4. Chama StorageService.save(encryptedBuffer)
  5. Chama BlockchainService.register(hash, storageRef)
  6. Persiste metadados via PrismaService
  7. Registra AuditLog (action UPLOAD)

Fluxo interno (createVersion — Fase 2.9):
  1. Verifica ownership do documento-mãe + não soft-deleted
  2. Executa fluxo idêntico ao upload (hash → encrypt → save → registerOnChain)
  3. Persiste nova row com previousDocumentId apontando pra mãe
  4. AuditLog action UPLOAD com metadata { versionOf: motherId }

Fluxo interno (delete — RF22-24):
  1. Marca Document.deletedAt = now()
  2. StorageService.delete(`${hash}.enc`)
  3. AuditLog.create(action DELETE, metadata { hash, fileName })
  4. Registro on-chain permanece imutável
```

### SharingModule (Fase 2.8)
```
Responsabilidade: compartilhar documento por email com destinatário externo
Dependências: DocumentsService, StorageService, CryptoService, PdfService, MailerService,
              PrismaService, AuditLogService
Expõe: POST /documents/:id/share
Fluxo interno:
  1. Verifica ownership + status CONFIRMED + não soft-deleted
  2. storage.retrieve(hash) → crypto.decrypt → buffer original
  3. pdf.generateComprovante(document) → PDF com hash + txHash + QR + link Etherscan
  4. mailer.send({ to, attachments: [original, comprovante] })
  5. Cria row DocumentShare (rastreio + verificationCount)
  6. AuditLog action SHARE com metadata { email, hash, comprovanteHash }
Rate limit: 5 shares/hora por usuário (query DocumentShare)
```

### MailerModule (Fase 2.8)
```
Responsabilidade: envio de emails transacionais
Dependências: nodemailer, provider SMTP (Resend/SendGrid — free tier)
Expõe: MailerService (injetável)
Métodos:
  - send({ to, subject, template, context, attachments? }): Promise<void>
Envs: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, MAIL_PROVIDER
Templates: handlebars ou string simples (share, welcome futuro, etc.)
```

### PdfModule (Fase 2.8)
```
Responsabilidade: gerar comprovante PDF em memória
Dependências: pdfmake, qrcode
Expõe: PdfService (injetável)
Métodos:
  - generateComprovante(document: Document): Promise<Buffer>
    → PDF 1-página com: fileName, hash, txHash, blockNumber, walletAddress,
       QR pra /verify/public/:hash, link Etherscan, instruções sha256sum/certutil
    → Rodapé com timestamp emissão + versão template
```

### AuditLogModule
```
Responsabilidade: trilha de auditoria das ações sensíveis (LGPD + investigação)
Expõe: AuditLogService (injetável)
Métodos:
  - log(action, userId?, resourceType?, resourceId?, metadata?, ipAddress?, userAgent?)
Persistência: tabela audit_logs (Prisma)
```

### VerificationAttemptModule
```
Responsabilidade: log de toda chamada a /verify (público ou privado) — analytics e anti-abuso
Expõe: VerificationAttemptService (injetável)
Métodos:
  - record(hash, found, source, documentId?, userId?, ipAddress?, userAgent?)
Persistência: tabela verification_attempts (Prisma)
```

### Interceptor global (RequestContextInterceptor)
```
Responsabilidade: capturar ipAddress + userAgent de cada request e expor via REQUEST scope
Usado por: AuditLogService, VerificationAttemptService
```

### BlockchainModule
```
Responsabilidade: interação com o Smart Contract na Sepolia
Dependências: ethers.js, ABI do contrato, variáveis de ambiente (RPC_URL, PRIVATE_KEY)
Expõe: BlockchainService (injetável)
Métodos:
  - registerDocument(hash: string, storageRef: string): Promise<TxReceipt>
  - verifyDocument(hash: string): Promise<DocumentRecord>
```

### StorageModule
```
Responsabilidade: abstração de storage (local ou IPFS)
Fase 1: salva arquivo .enc em /uploads com nome = hash do arquivo
Fase 2: faz add() no Kubo local e retorna CID
Expõe: StorageService (injetável)
Métodos:
  - save(buffer: Buffer, filename: string): Promise<StorageRef>
  - retrieve(ref: StorageRef): Promise<Buffer>
```

### CryptoService (shared service, não é módulo separado)
```
Responsabilidade: hash e criptografia
Métodos:
  - hashFile(buffer: Buffer): string          → SHA-256 em hex
  - encrypt(buffer: Buffer): EncryptedPayload → AES-256-GCM
  - decrypt(payload: EncryptedPayload): Buffer
Chave de criptografia: variável de ambiente ENCRYPTION_KEY (32 bytes em hex)
```

---

## Fluxo Detalhado de Upload

```
POST /documents (multipart/form-data)
│
├─ 1. Multer intercepta o arquivo → buffer em memória
│
├─ 2. DocumentsService.create(file, userId)
│     │
│     ├─ 2.1 Cria registro no banco: status = PENDING
│     │
│     ├─ 2.2 hash = CryptoService.hashFile(buffer)
│     │         → SHA-256 do arquivo ORIGINAL (antes de criptografar)
│     │
│     ├─ 2.3 encryptedPayload = CryptoService.encrypt(buffer)
│     │         → { ciphertext, iv, authTag } — AES-256-GCM
│     │
│     ├─ 2.4 storageRef = StorageService.save(encryptedPayload, hash)
│     │         Fase 1: salva como /uploads/{hash}.enc
│     │         Fase 2: ipfs add → retorna CID
│     │
│     ├─ 2.5 txReceipt = BlockchainService.registerDocument(hash, storageRef)
│     │         → chama contrato DocumentRegistry.registerDocument(hash, storageRef)
│     │         → aguarda confirmação (1 bloco)
│     │
│     └─ 2.6 Atualiza registro no banco:
│               status = CONFIRMED
│               storage_ref = storageRef
│               tx_hash = txReceipt.hash
│               confirmed_at = now()
│
└─ Retorna: DocumentResponseDto (metadados completos)
```

## Fluxo Detalhado de Verificação

```
POST /documents/verify (multipart/form-data ou { documentId, file })
│
├─ 1. Recalcula hash do arquivo enviado
│
├─ 2. Busca documento no banco pelo documentId
│
├─ 3. Compara hash recalculado com hash salvo no banco
│
├─ 4. Consulta BlockchainService.verifyDocument(hash)
│     → chama contrato DocumentRegistry.verifyDocument(hash)
│     → retorna { exists, timestamp, registeredBy }
│
└─ Retorna: VerificationResult
     {
       hashMatch: boolean,        ← hash recalculado == hash no banco
       blockchainConfirmed: boolean, ← hash existe no contrato
       registeredAt: Date,
       registeredBy: string,      ← endereço da wallet
       txHash: string
     }
```

---

## Modelo de Dados (visão relacional)

```
users
  id (UUID)
  email (unique)
  password_hash
  name
  created_at
  updated_at

documents
  id (UUID)
  user_id (FK → users.id)
  file_name
  mime_type
  file_size
  hash (SHA-256 hex, unique)
  hash_algorithm (default: SHA-256)
  storage_type (LOCAL | IPFS)
  storage_ref (path local ou CID)
  encryption_iv (hex — necessário para decrypt)
  encryption_auth_tag (hex — necessário para decrypt)
  tx_hash (hash da transação blockchain)
  network (default: sepolia)
  wallet_address
  block_number
  status (PENDING | PROCESSING | CONFIRMED | FAILED)
  error_message
  uploaded_at
  confirmed_at
  updated_at
  deleted_at  ← soft-delete (RF22-24); on-chain permanece
  previous_document_id (FK → documents.id, nullable — versionamento Fase 2.9)

audit_logs                                  ← LGPD + investigação
  id (UUID)
  user_id (FK → users.id, NULL em ações públicas)
  action (LOGIN | LOGOUT | REGISTER | UPLOAD | DOWNLOAD | DELETE |
          VERIFY_PUBLIC | VERIFY_PRIVATE | SHARE)
  resource_type
  resource_id
  ip_address
  user_agent
  metadata (JSONB)
  created_at

document_shares (Fase 2.8)                  ← rastreio de compartilhamentos
  id (UUID)
  document_id (FK → documents.id)
  shared_by_user_id (FK → users.id)
  shared_with_email                          ← destinatário externo (não precisa conta)
  message                                    ← opcional, máx 500 chars
  comprovante_hash                           ← SHA-256 do PDF emitido (auditoria)
  sent_at
  verification_count                         ← incrementado ao escanear QR do comprovante

verification_attempts                       ← analytics + anti-abuso
  id (UUID)
  hash (SHA-256 consultado)
  found (bool — true se hash existe on-chain)
  document_id (FK → documents.id, NULL se hash desconhecido)
  user_id (FK → users.id, NULL para PUBLIC)
  source (PUBLIC | PRIVATE)
  ip_address
  user_agent
  created_at
```

---

## Segurança — Decisões de Design

| Decisão | Justificativa |
|---|---|
| Hash gerado do arquivo ORIGINAL (antes de criptografar) | Permite verificação sem precisar descriptografar — basta re-hashar o arquivo enviado |
| AES-256-GCM para criptografia | GCM fornece autenticação (authTag) além de confidencialidade — detecta adulteração do arquivo criptografado |
| IV e authTag salvos no banco | Necessários para descriptografia — sem eles o arquivo não pode ser recuperado |
| ENCRYPTION_KEY em variável de ambiente | Nunca hardcoded, nunca no repositório |
| PRIVATE_KEY da wallet em variável de ambiente | Idem — carteira usada apenas pelo backend para assinar transações |
| JWT com expiração curta (15min access) | Padrão SaaS seguro |
| JWT em **cookie httpOnly** (Secure, SameSite=Lax) — nunca exposto ao JS | Proteção contra XSS; token inacessível via `document.cookie` |
| Validação regex `^[a-fA-F0-9]{64}$` no hash de `/verify/public` antes de RPC | Defesa contra abuso de RPC e custo desnecessário (RF19, E07) |
| Soft-delete (`deletedAt`) — não apaga o registro fisicamente | Preserva trilha de auditoria mesmo após exclusão pelo usuário (LGPD) |
| Registro on-chain permanece após delete local | Blockchain é imutável por natureza — backend não tenta "apagar" tx Sepolia |
| `AuditLog` + `VerificationAttempt` em tabelas separadas | Compliance LGPD (rastreabilidade) + analytics anti-abuso |

---

## Comunicação entre Serviços (Fase 1 - desenvolvimento local)

```
docchain-web      → http://localhost:3001  (Next.js dev server)
docchain-api      → http://localhost:3000  (NestJS)
PostgreSQL        → localhost:5432
Storage local     → /uploads (volume Docker)
Sepolia RPC       → https://sepolia.infura.io/v3/{PROJECT_ID}  (externo)
```

Docker Compose orquestra: PostgreSQL + docchain-api.
docchain-web roda separado em dev, ou em container para staging.
