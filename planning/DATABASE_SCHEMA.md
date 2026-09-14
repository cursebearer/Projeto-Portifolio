# Schema do Banco de Dados — DocChain

## Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────
// ENUM: Status do processamento do documento
// ─────────────────────────────────────────────────────────────

enum DocumentStatus {
  PENDING      // Registro criado, processamento não iniciado
  PROCESSING   // Hash gerado, aguardando confirmação blockchain
  CONFIRMED    // tx_hash confirmado na blockchain
  FAILED       // Erro em alguma etapa do processamento
}

enum StorageType {
  LOCAL  // Arquivo salvo em disco local (/uploads)
  IPFS   // Arquivo salvo no IPFS (Fase 2)
}

enum AuditAction {
  LOGIN
  LOGOUT
  REGISTER
  UPLOAD
  DOWNLOAD
  DELETE
  VERIFY_PUBLIC   // /verify sem autenticação
  VERIFY_PRIVATE  // verificação via dashboard (RF16)
  SHARE           // compartilhamento por email (Fase 2.8)
}

enum VerificationSource {
  PUBLIC   // chamada via /verify (sem login)
  PRIVATE  // chamada via dashboard autenticado
}

// ─────────────────────────────────────────────────────────────
// TABELA: users
// ─────────────────────────────────────────────────────────────

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  passwordHash  String     @map("password_hash")
  name          String?
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  documents             Document[]
  auditLogs             AuditLog[]
  verificationAttempts  VerificationAttempt[]
  documentShares        DocumentShare[]

  @@map("users")
}

// ─────────────────────────────────────────────────────────────
// TABELA: documents
// ─────────────────────────────────────────────────────────────

model Document {
  // Identificação
  id              String         @id @default(uuid())
  userId          String         @map("user_id")

  // Metadados do arquivo original
  fileName        String         @map("file_name")          // nome original do arquivo
  mimeType        String         @map("mime_type")          // ex: application/pdf
  fileSize        Int            @map("file_size")          // tamanho em bytes

  // Integridade
  hash            String         @unique                    // SHA-256 hex do arquivo ORIGINAL
  hashAlgorithm   String         @default("SHA-256") @map("hash_algorithm")

  // Storage
  storageType     StorageType    @default(LOCAL) @map("storage_type")
  storageRef      String?        @map("storage_ref")        // path local ou CID IPFS

  // Criptografia (necessário para descriptografia posterior)
  encryptionIv      String?      @map("encryption_iv")      // IV em hex (AES-GCM)
  encryptionAuthTag String?      @map("encryption_auth_tag") // authTag em hex (AES-GCM)

  // Blockchain
  txHash          String?        @map("tx_hash")            // hash da transação na Sepolia
  network         String?        @default("sepolia")        // rede blockchain
  walletAddress   String?        @map("wallet_address")     // endereço que fez o registro
  blockNumber     Int?           @map("block_number")       // bloco onde foi minerado

  // Status e timestamps
  status          DocumentStatus @default(PENDING)
  errorMessage    String?        @map("error_message")      // mensagem de erro se FAILED
  uploadedAt      DateTime       @default(now()) @map("uploaded_at")
  confirmedAt     DateTime?      @map("confirmed_at")       // quando blockchain confirmou
  updatedAt       DateTime       @updatedAt @map("updated_at")
  deletedAt       DateTime?      @map("deleted_at")         // soft-delete (RF22-24); registro on-chain permanece

  // Versionamento (Fase 2.9) — self-reference nullable
  previousDocumentId String?     @map("previous_document_id")
  previousDocument   Document?   @relation("DocumentVersions", fields: [previousDocumentId], references: [id])
  nextVersions       Document[]  @relation("DocumentVersions")

  // Relações
  user                  User                  @relation(fields: [userId], references: [id])
  verificationAttempts  VerificationAttempt[]
  shares                DocumentShare[]

  @@index([userId])
  @@index([hash])
  @@index([status])
  @@index([deletedAt])
  @@index([previousDocumentId])
  @@map("documents")
}

// ─────────────────────────────────────────────────────────────
// TABELA: document_shares (Fase 2.8)
// Rastreia envios do documento por email — compliance + analytics
// ─────────────────────────────────────────────────────────────

model DocumentShare {
  id                 String   @id @default(uuid())
  documentId         String   @map("document_id")
  sharedByUserId     String   @map("shared_by_user_id")     // dono que enviou
  sharedWithEmail    String   @map("shared_with_email")     // destinatário externo (não precisa ter conta)
  message            String?  @db.VarChar(500)                // mensagem opcional do remetente (limite 500 chars no DB + DTO)
  comprovanteHash    String   @map("comprovante_hash")       // SHA-256 do PDF de comprovante gerado (auditoria)
  sentAt             DateTime @default(now()) @map("sent_at")
  verificationCount  Int      @default(0) @map("verification_count")  // incrementado quando QR do comprovante é escaneado

  document           Document @relation(fields: [documentId], references: [id])
  sharedByUser       User     @relation(fields: [sharedByUserId], references: [id])

  @@index([documentId])
  @@index([sharedByUserId])
  @@index([sharedWithEmail])
  @@index([sentAt])
  @@map("document_shares")
}

// ─────────────────────────────────────────────────────────────
// TABELA: audit_logs
// Trilha de auditoria — compliance LGPD e investigação de incidentes
// ─────────────────────────────────────────────────────────────

model AuditLog {
  id           String      @id @default(uuid())
  userId       String?     @map("user_id")              // NULL em ações públicas
  action       AuditAction
  resourceType String?     @map("resource_type")        // "document", "user", etc.
  resourceId   String?     @map("resource_id")          // ID do recurso afetado
  ipAddress    String?     @map("ip_address")           // IPv4 ou IPv6
  userAgent    String?     @map("user_agent")
  metadata     Json?                                     // Dados específicos da ação (ex: { fileName, hash })
  createdAt    DateTime    @default(now()) @map("created_at")

  user         User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

// ─────────────────────────────────────────────────────────────
// TABELA: verification_attempts
// Log de cada chamada a /verify (público ou privado) — analytics e anti-abuso
// ─────────────────────────────────────────────────────────────

model VerificationAttempt {
  id          String             @id @default(uuid())
  hash        String                                          // SHA-256 consultado
  found       Boolean                                         // true se hash existe on-chain
  documentId  String?            @map("document_id")          // Preenchido se found=true E registro existe no banco
  userId      String?            @map("user_id")              // NULL para PUBLIC; preenchido para PRIVATE
  source      VerificationSource @default(PUBLIC)
  ipAddress   String?            @map("ip_address")
  userAgent   String?            @map("user_agent")
  createdAt   DateTime           @default(now()) @map("created_at")

  document    Document?          @relation(fields: [documentId], references: [id], onDelete: SetNull)
  user        User?              @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([hash])
  @@index([documentId])
  @@index([createdAt])
  @@map("verification_attempts")
}
```

---

## Migrations

Para gerar a migration inicial após definir o schema:
```bash
cd docchain-api
npx prisma migrate dev --name init
```

Para aplicar migrations em produção:
```bash
npx prisma migrate deploy
```

Para explorar o banco via interface:
```bash
npx prisma studio
```

---

## Tipos TypeScript Derivados do Schema

O Prisma gera automaticamente os tipos. Use-os no NestJS assim:

```typescript
// Importar tipos gerados pelo Prisma
import { Document, User, DocumentStatus, StorageType } from '@prisma/client';

// Tipo para criação de documento (sem campos opcionais/gerados)
import { Prisma } from '@prisma/client';
type CreateDocumentInput = Prisma.DocumentCreateInput;

// Tipo para documento com relação ao usuário incluída
type DocumentWithUser = Prisma.DocumentGetPayload<{
  include: { user: true }
}>;
```

---

## Queries Prisma Principais

### Criar documento inicial (status PENDING)
```typescript
const document = await this.prisma.document.create({
  data: {
    userId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    hash,
    status: DocumentStatus.PENDING,
  }
});
```

### Atualizar após confirmação blockchain
```typescript
await this.prisma.document.update({
  where: { id: documentId },
  data: {
    status: DocumentStatus.CONFIRMED,
    storageRef,
    storageType: StorageType.LOCAL,
    encryptionIv: iv,
    encryptionAuthTag: authTag,
    txHash: txReceipt.hash,
    walletAddress: txReceipt.from,
    blockNumber: txReceipt.blockNumber,
    confirmedAt: new Date(),
  }
});
```

### Listar documentos do usuário (paginado, excluindo soft-deleted)
```typescript
const where = { userId, deletedAt: null };
const [documents, total] = await this.prisma.$transaction([
  this.prisma.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  this.prisma.document.count({ where })
]);
```

### Buscar documento por hash (para verificação)
```typescript
const document = await this.prisma.document.findUnique({
  where: { hash }
});
```

### Soft-delete de documento (RF22-24)
```typescript
// 1. Marca deletedAt no banco
await this.prisma.document.update({
  where: { id: documentId },
  data: { deletedAt: new Date() },
});

// 2. Remove arquivo cifrado do disco
await this.storageService.delete(`${document.hash}.enc`);

// 3. Registra audit log
await this.prisma.auditLog.create({
  data: {
    userId,
    action: AuditAction.DELETE,
    resourceType: 'document',
    resourceId: documentId,
    ipAddress,
    userAgent,
    metadata: { hash: document.hash, fileName: document.fileName },
  },
});
```

### Registrar audit log
```typescript
await this.prisma.auditLog.create({
  data: {
    userId,                          // null em ações públicas
    action: AuditAction.UPLOAD,
    resourceType: 'document',
    resourceId: document.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { fileName, hash },
  },
});
```

### Registrar tentativa de verificação
```typescript
await this.prisma.verificationAttempt.create({
  data: {
    hash,
    found: blockchainResult.exists,
    documentId: document?.id ?? null,
    userId: currentUser?.id ?? null,           // null para PUBLIC
    source: currentUser ? VerificationSource.PRIVATE : VerificationSource.PUBLIC,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
});
```

### Criar nova versão de documento (Fase 2.9)
```typescript
// Após executar todo o fluxo idêntico ao create() (hash → encrypt → save → registerOnChain → CONFIRMED)
const newVersion = await this.prisma.document.create({
  data: {
    userId,
    previousDocumentId: motherDocId,           // vincula à versão anterior
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    hash: newHash,
    storageType: StorageType.LOCAL,
    storageRef,
    encryptionIv,
    encryptionAuthTag,
    txHash,
    walletAddress,
    blockNumber,
    status: DocumentStatus.CONFIRMED,
    confirmedAt: new Date(),
  }
});
```

### Buscar timeline de versões de um documento (Fase 2.9)
```typescript
// 1. Encontra a raiz da árvore (documento sem previousDocumentId)
async function findRoot(docId: string): Promise<Document> {
  let current = await this.prisma.document.findUnique({ where: { id: docId } });
  while (current?.previousDocumentId) {
    current = await this.prisma.document.findUnique({
      where: { id: current.previousDocumentId }
    });
  }
  return current;
}

// 2. Coleta todos descendentes (recursivo BFS)
async function collectDescendants(rootId: string): Promise<Document[]> {
  const all: Document[] = [];
  const queue = [rootId];
  while (queue.length) {
    const parentId = queue.shift()!;
    const children = await this.prisma.document.findMany({
      where: { previousDocumentId: parentId }
    });
    all.push(...children);
    queue.push(...children.map(c => c.id));
  }
  return all;
}
```

### Registrar compartilhamento por email (Fase 2.8)
```typescript
// Após enviar email com sucesso
await this.prisma.documentShare.create({
  data: {
    documentId,
    sharedByUserId: currentUser.id,
    sharedWithEmail: dto.email,
    message: dto.message,
    comprovanteHash,     // SHA-256 do PDF gerado (auditoria)
  }
});

await this.prisma.auditLog.create({
  data: {
    userId: currentUser.id,
    action: AuditAction.SHARE,
    resourceType: 'document',
    resourceId: documentId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { email: dto.email, hash: document.hash, comprovanteHash },
  },
});
```

### Rate limit de compartilhamento (5/hora por usuário)
```typescript
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentShares = await this.prisma.documentShare.count({
  where: {
    sharedByUserId: userId,
    sentAt: { gte: oneHourAgo }
  }
});
if (recentShares >= 5) {
  throw new HttpException('Rate limit: 5 compartilhamentos/hora', 429);
}
```

### Incrementar verificationCount quando QR do comprovante é escaneado
```typescript
// Em GET /verify/public/:hash, quando source vem do QR do comprovante
// (adicionar query param ?ref=share:{shareId} no QR)
if (req.query.ref?.startsWith('share:')) {
  const shareId = req.query.ref.split(':')[1];
  await this.prisma.documentShare.update({
    where: { id: shareId },
    data: { verificationCount: { increment: 1 } }
  });
}
```

---

## Seed para Desenvolvimento/Demonstração

```typescript
// prisma/seed.ts
import { PrismaClient, DocumentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário de demonstração
  const user = await prisma.user.upsert({
    where: { email: 'demo@docchain.com' },
    update: {},
    create: {
      email: 'demo@docchain.com',
      passwordHash: await bcrypt.hash('demo123456', 10),
      name: 'Demo User',
    },
  });

  console.log('Seed concluído. Usuário:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Adicionar no `package.json` do `docchain-api`:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

Executar:
```bash
npx prisma db seed
```
