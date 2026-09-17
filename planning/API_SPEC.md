# Especificação da API — DocChain Backend (NestJS)

## Base URL
```
Development: http://localhost:3000
Swagger UI:  http://localhost:3000/api/docs
```

## Autenticação
Todas as rotas marcadas com **[auth]** requerem **cookie httpOnly** `access_token` enviado automaticamente pelo navegador.

O backend emite o cookie em `POST /auth/login` via header:
```
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
```

O frontend deve configurar o axios com `withCredentials: true` para que o navegador anexe o cookie nas requisições subsequentes. O JWT **nunca** é exposto ao JavaScript do frontend.

---

## Módulo: Auth

### POST /auth/register
Cria novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "minimo8caracteres",
  "name": "Nome Opcional"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nome Opcional",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Erros:**
- `400` — email inválido ou senha fraca
- `409` — email já cadastrado

---

### POST /auth/login
Autentica usuário e emite cookie httpOnly. **Não retorna o token no corpo.**

**Body:**
```json
{
  "email": "user@example.com",
  "password": "suasenha"
}
```

**Response 200:**
```
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
```
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome"
  }
}
```

**Erros:**
- `401` — credenciais inválidas

---

### POST /auth/logout [auth]
Encerra a sessão descartando o cookie no navegador.

**Response 204:**
```
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
```

---

### GET /auth/me [auth]
Retorna dados do usuário autenticado (usado pelo frontend para hidratar o Zustand store após login, já que o JWT vive apenas no cookie httpOnly). Também atende o direito de **confirmação/acesso** (LGPD Art. 18, I-II).

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nome",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Erros:**
- `401` — cookie ausente ou JWT expirado

---

### PATCH /auth/me [auth]
Atualiza dados do usuário autenticado. Atende o direito de **correção** (LGPD Art. 18, III).

Apenas `name` é editável. O `email` é imutável após cadastro para preservar a integridade da chave única.

**Body:**
```json
{
  "name": "Novo Nome"
}
```

**Response 200:** (mesmo formato do GET /auth/me)

**Erros:**
- `400` — campo inválido
- `401` — não autenticado

---

### DELETE /auth/me [auth]
Elimina a conta do usuário e todos os seus dados pessoais. Atende o direito de **eliminação / anonimização** (LGPD Art. 18, VI) e a **revogação de consentimento**.

Comportamento (executado em transação):
1. Remove fisicamente os arquivos cifrados de `${UPLOAD_DIR}` correspondentes a `Document.storageRef` do usuário
2. Deleta registros de `Document` em cascata via Prisma
3. Anonimiza `AuditLog` e `VerificationAttempt` setando `userId = NULL` (registro operacional preservado, vínculo pessoal removido)
4. Deleta o `User`
5. Apaga o cookie de sessão (`Set-Cookie: access_token=; Max-Age=0`)

**Observação on-chain:** o hash SHA-256 e o `walletAddress` do servidor permanecem registrados na Sepolia (imutável por natureza). Como o hash é função de mão única e o `walletAddress` é da wallet do servidor (não do usuário), o registro on-chain torna-se um **hash órfão** sem associação pessoal recuperável.

**Response 204:** (sem body)

**Erros:**
- `401` — não autenticado

---

### GET /auth/me/export [auth]
Retorna JSON com todos os dados pessoais do usuário. Atende o direito de **portabilidade** (LGPD Art. 18, V).

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "documents": [
    {
      "id": "uuid",
      "fileName": "contrato.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "hash": "a3f5c8...",
      "txHash": "0xabc...",
      "network": "sepolia",
      "blockNumber": 5847291,
      "status": "CONFIRMED",
      "uploadedAt": "2026-01-01T10:00:00.000Z",
      "confirmedAt": "2026-01-01T10:00:15.000Z"
    }
  ]
}
```

**Headers:**
```
Content-Disposition: attachment; filename="docchain-export-{userId}-{date}.json"
```

**Erros:**
- `401` — não autenticado

---

## Módulo: Documents

### POST /documents [auth]
Faz upload de um documento e executa o fluxo completo.

**Content-Type:** `multipart/form-data`

**Form fields:**
```
file: File  (obrigatório — qualquer tipo, max 50MB configurável)
```

**Response 201:**
```json
{
  "id": "uuid",
  "fileName": "contrato.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1024000,
  "hash": "a3f5c8d2e1b09f4...",
  "hashAlgorithm": "SHA-256",
  "storageType": "LOCAL",
  "storageRef": "/uploads/a3f5c8d2e1b09f4.enc",
  "txHash": "0xabc123...",
  "network": "sepolia",
  "walletAddress": "0xdef456...",
  "blockNumber": 5847291,
  "status": "CONFIRMED",
  "uploadedAt": "2024-01-01T10:00:00.000Z",
  "confirmedAt": "2024-01-01T10:00:15.000Z"
}
```

**Erros:**
- `400` — arquivo ausente ou tipo não permitido
- `413` — arquivo muito grande
- `500` — erro ao registrar na blockchain (detalhes no campo `message`)

**Nota:** Esta rota pode demorar 15-30 segundos pois aguarda confirmação de 1 bloco na Sepolia.

---

### GET /documents [auth]
Lista documentos do usuário autenticado com paginação.

**Query params:**
```
page    (default: 1)
limit   (default: 10, max: 50)
status  (opcional: PENDING | PROCESSING | CONFIRMED | FAILED)
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "fileName": "contrato.pdf",
      "mimeType": "application/pdf",
      "fileSize": 1024000,
      "hash": "a3f5c8...",
      "status": "CONFIRMED",
      "txHash": "0xabc...",
      "network": "sepolia",
      "uploadedAt": "2024-01-01T10:00:00.000Z",
      "confirmedAt": "2024-01-01T10:00:15.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET /documents/:id [auth]
Retorna detalhe completo de um documento.

**Response 200:** (mesmo formato do POST /documents)

**Erros:**
- `404` — documento não encontrado ou não pertence ao usuário

---

### POST /documents/verify [auth]
Verifica a integridade de um documento.

Aceita duas formas:
1. Reenvia o arquivo → sistema recalcula o hash e compara
2. Informa o hash diretamente → sistema só consulta blockchain

**Opção 1 — via arquivo (multipart/form-data):**
```
file:       File    (o arquivo a ser verificado)
documentId: string  (UUID do documento no sistema)
```

**Opção 2 — via hash (application/json):**
```json
{
  "hash": "a3f5c8d2e1b09f4..."
}
```

**Response 200:**
```json
{
  "verified": true,
  "hashMatch": true,
  "blockchainConfirmed": true,
  "document": {
    "id": "uuid",
    "fileName": "contrato.pdf",
    "hash": "a3f5c8...",
    "status": "CONFIRMED"
  },
  "blockchain": {
    "exists": true,
    "registeredAt": "2024-01-01T10:00:15.000Z",
    "registeredBy": "0xdef456...",
    "storageRef": "/uploads/a3f5c8.enc",
    "txHash": "0xabc123..."
  },
  "recalculatedHash": "a3f5c8..."
}
```

**Quando a verificação FALHA:**
```json
{
  "verified": false,
  "hashMatch": false,
  "blockchainConfirmed": false,
  "reason": "Hash do arquivo enviado não corresponde ao hash registrado. O documento pode ter sido modificado."
}
```

---

### DELETE /documents/:id [auth]
Exclui um documento aplicando **soft-delete** (RF22-24).

Comportamento:
1. Marca `Document.deletedAt = now()` no banco
2. Remove fisicamente o arquivo cifrado de `${UPLOAD_DIR}/{hash}.enc`
3. Registra ação em `AuditLog` (action `DELETE`, `resourceId = document.id`, `metadata = { hash, fileName }`)
4. **Não altera o registro on-chain** — a transação na Sepolia é imutável; `/verify/public/:hash` continua retornando `exists: true`

**Response 204:** (sem body)

**Erros:**
- `404` — documento não encontrado ou não pertence ao usuário

---

### GET /documents/:id/download [auth]
Retorna o arquivo original (descriptografado).

**Response 200:**
```
Content-Type: application/pdf (ou o mime type original)
Content-Disposition: attachment; filename="contrato.pdf"

[bytes do arquivo descriptografado]
```

**Erros:**
- `404` — documento não encontrado
- `403` — documento não pertence ao usuário

---

### POST /documents/:id/share [auth]  (Fase 2.8)
Envia o documento original + comprovante em PDF por email para um destinatário externo.

**Rate limit:** 5 requisições/hora por usuário (evita spam via DocChain).

**Body (application/json):**
```json
{
  "email": "juiz@tribunal.gov.br",
  "message": "Segue o contrato assinado para vosso conhecimento."
}
```

**Campos:**
- `email` (obrigatório) — endereço do destinatário (validado por `@IsEmail()`)
- `message` (opcional) — mensagem livre incluída no corpo do email (máx 500 chars)

**Fluxo interno:**
1. Verifica ownership do documento (`Document.userId === currentUser.id`)
2. Bloqueia se `status !== CONFIRMED` (sem prova on-chain ainda) → `400`
3. Bloqueia se `deletedAt IS NOT NULL` (soft-deleted) → `404`
4. `storage.retrieve(hash)` + `crypto.decrypt` → buffer original
5. `pdf.generateComprovante(document)` → PDF com hash, txHash, blockNumber, QR pra `/verify/public/:hash`, link Etherscan
6. `mailer.send({ to, subject, attachments: [original, comprovante] })`
7. Cria row `DocumentShare` (rastreio: docId, email, sentAt, comprovanteHash)
8. `AuditLog.log(SHARE)` com metadata `{ email, docId, hash }`

**Response 202 Accepted:**
```json
{
  "shareId": "share-uuid-1",
  "documentId": "d-uuid-1",
  "sharedWithEmail": "juiz@tribunal.gov.br",
  "sentAt": "2026-09-15T10:30:00.000Z",
  "comprovanteHash": "b2a1c9..."
}
```

**Erros:**
- `400` — email inválido, documento em status não-CONFIRMED, ou mensagem > 500 chars
- `404` — documento não existe, não pertence ao usuário, ou soft-deleted
- `429` — rate limit atingido (5/h)
- `502` — falha no provedor SMTP (nada é gravado no banco, retry manual)

**Comprovante PDF (anexo) — conteúdo:**
- Identificação: fileName, mimeType, fileSize, usuário emissor, timestamp registro
- Hash SHA-256 do documento
- On-chain: rede, contrato, txHash, blockNumber, timestamp, walletAddress DocChain
- Instruções de verificação independente (`sha256sum`, `certutil hashfile`)
- QR code pra `docchain.dev/verify/public/{hash}`
- Link direto pro Etherscan
- Rodapé: data emissão + versão do template

---

### POST /documents/:id/versions [auth]  (Fase 2.9)
Cria uma nova versão de um documento existente. Cada versão gera um novo hash SHA-256 e um novo registro on-chain independente, mantendo a cronologia via `previousDocumentId`.

**Uso típico:** documento original (v1) → assinatura externa → upload da versão assinada (v2 ligada a v1) → contra-assinatura → v3 ligada a v2. Cada versão tem prova temporal própria on-chain.

**Body (multipart/form-data):**
```
file: File   (nova versão do arquivo — hash deve ser único on-chain)
```

**Fluxo interno:**
1. Verifica ownership do documento-mãe (`:id`)
2. Bloqueia se documento-mãe `deletedAt IS NOT NULL` → `404`
3. Executa fluxo idêntico ao `POST /documents` (hash → encrypt → save → `registerDocument` on-chain → CONFIRMED)
4. Row nova salva com `previousDocumentId = :id`
5. `AuditLog.log(UPLOAD)` com metadata `{ versionOf: :id }`

**Response 201 Created:** (mesmo formato do POST /documents, com campo extra `previousDocumentId`)
```json
{
  "id": "d-uuid-2",
  "previousDocumentId": "d-uuid-1",
  "fileName": "contrato-assinado.pdf",
  "hash": "9b1e7f4a...",
  "status": "CONFIRMED",
  "txHash": "0x8f4feb...",
  "blockNumber": 5847293,
  ...
}
```

**Erros:**
- `400` — arquivo ausente ou hash malformado
- `404` — documento-mãe não existe, não pertence ao usuário, ou soft-deleted
- `409` — hash da nova versão já existe on-chain (arquivo idêntico já registrado)
- `500` — falha genérica no fluxo (rollback aplicado, row FAILED)

**Nota:** qualquer versão pode originar nova versão (fork/branch). Ex: v1 pode ter v2a (assinado por A) e v2b (assinado por B) em paralelo.

---

### GET /documents/:id/versions [auth]  (Fase 2.9)
Retorna a timeline completa de versões de um documento, incluindo raízes e ramificações.

**Params:** `id` (UUID de qualquer versão da árvore — backend resolve pra raiz e retorna a árvore inteira)

**Response 200:**
```json
{
  "root": {
    "id": "d-uuid-1",
    "fileName": "contrato.pdf",
    "hash": "a3f5c8...",
    "txHash": "0x8f4f...",
    "blockNumber": 5847291,
    "uploadedAt": "2026-08-25T15:30:14.000Z",
    "previousDocumentId": null
  },
  "versions": [
    {
      "id": "d-uuid-2",
      "previousDocumentId": "d-uuid-1",
      "fileName": "contrato-assinado.pdf",
      "hash": "9b1e7f...",
      "txHash": "0x1a2b...",
      "blockNumber": 5847293,
      "uploadedAt": "2026-08-26T10:15:00.000Z"
    }
  ],
  "totalVersions": 2
}
```

**Erros:**
- `404` — documento não existe ou não pertence ao usuário

---

### GET /verify/public/:hash
Verificação pública — sem autenticação. Consulta apenas a blockchain.

**Validação (RF19, E07):** o backend valida o formato do hash **antes** de consultar a blockchain — exige exatamente 64 caracteres hexadecimais (regex `^[a-fA-F0-9]{64}$`). Hash inválido → `400 Bad Request` sem chamada on-chain (defesa contra abuso de RPC).

**Params:**
```
hash: string (SHA-256 hex do documento — 64 chars [a-fA-F0-9])
```

**Response 200:**
```json
{
  "hash": "a3f5c8...",
  "registered": true,
  "registeredAt": "2024-01-01T10:00:15.000Z",
  "registeredBy": "0xdef456...",
  "network": "sepolia",
  "storageRef": "/uploads/a3f5c8.enc"
}
```

**Response quando não registrado:**
```json
{
  "hash": "a3f5c8...",
  "registered": false
}
```

---

### GET /health
Health check público.

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "blockchain": "connected",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## DTOs de Validação (class-validator)

### CreateDocumentDto
```typescript
// O arquivo vem via @UploadedFile() — não precisa de DTO para o arquivo em si
// Mas o controller pode receber metadados adicionais via @Body() se necessário
```

### VerifyDocumentDto
```typescript
import { IsOptional, IsUUID, IsString, Length } from 'class-validator';

export class VerifyDocumentDto {
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsString()
  @Length(64, 64, { message: 'Hash SHA-256 deve ter exatamente 64 caracteres hex' })
  hash?: string;
}
```

### LoginDto
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### RegisterDto
```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
```

---

## Configuração do Multer no NestJS

```typescript
// documents.controller.ts
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Post()
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(), // buffer em memória — não salva em disco ainda
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, callback) => {
    // Aceitar qualquer tipo — a validação de negócio fica no service
    callback(null, true);
  }
}))
async uploadDocument(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
) {
  if (!file) throw new BadRequestException('Arquivo não enviado');
  return this.documentsService.create(file, user.id);
}
```

---

## Tratamento de Erros — Filtro Global

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Erro interno do servidor';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Configuração do Swagger

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('DocChain API')
  .setDescription('API de registro e verificação de documentos com blockchain')
  .setVersion('1.0')
  .addCookieAuth('access_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'access_token',
  })
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```
