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

  documents     Document[]

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

  // Relação
  user            User           @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([hash])
  @@index([status])
  @@map("documents")
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

### Listar documentos do usuário (paginado)
```typescript
const [documents, total] = await this.prisma.$transaction([
  this.prisma.document.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  this.prisma.document.count({ where: { userId } })
]);
```

### Buscar documento por hash (para verificação)
```typescript
const document = await this.prisma.document.findUnique({
  where: { hash }
});
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
