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
   ┌──────────────────┐      ┌──────────────────────┐    ┌────────────────────┐
   │   PostgreSQL     │      │  Storage Local        │    │  Sepolia Testnet   │
   │   (metadados)    │      │  /uploads/*.enc        │    │  (Smart Contract)  │
   │                  │      │                        │    │                    │
   │  documents       │      │  Fase 2: IPFS/Kubo    │    │  DocumentRegistry  │
   │  users           │      │  localhost:5001        │    │  Solidity          │
   └──────────────────┘      └──────────────────────┘    └────────────────────┘
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
Responsabilidade: autenticação e autorização
Dependências: @nestjs/passport, @nestjs/jwt, bcrypt
Expõe: POST /auth/login, POST /auth/register
Guards: JwtAuthGuard (aplicado globalmente nas rotas protegidas)
```

### DocumentsModule
```
Responsabilidade: orquestrar o fluxo completo do documento
Dependências: StorageModule, BlockchainModule, CryptoService, PrismaService
Expõe: POST /documents, GET /documents, GET /documents/:id, POST /documents/verify
Fluxo interno:
  1. Recebe multipart/form-data
  2. Chama CryptoService.hash(buffer)
  3. Chama CryptoService.encrypt(buffer)
  4. Chama StorageService.save(encryptedBuffer)
  5. Chama BlockchainService.register(hash, storageRef)
  6. Persiste metadados via PrismaService
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
  created_at

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
  status (PENDING | PROCESSING | CONFIRMED | FAILED)
  uploaded_at
  confirmed_at
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
| JWT com expiração curta (15min access + refresh) | Padrão SaaS seguro |

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
