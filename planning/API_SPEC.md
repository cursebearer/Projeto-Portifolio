# Especificação da API — DocChain Backend (NestJS)

## Base URL
```
Development: http://localhost:3000
Swagger UI:  http://localhost:3000/api/docs
```

## Autenticação
Todas as rotas marcadas com 🔒 requerem header:
```
Authorization: Bearer {access_token}
```

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
Autentica usuário e retorna JWT.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "suasenha"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

## Módulo: Documents

### POST /documents 🔒
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

### GET /documents 🔒
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

### GET /documents/:id 🔒
Retorna detalhe completo de um documento.

**Response 200:** (mesmo formato do POST /documents)

**Erros:**
- `404` — documento não encontrado ou não pertence ao usuário

---

### POST /documents/verify 🔒
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

### GET /documents/:id/download 🔒
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

### GET /verify/public/:hash
Verificação pública — sem autenticação. Consulta apenas a blockchain.

**Params:**
```
hash: string (SHA-256 hex do documento)
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
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```
