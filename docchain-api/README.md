# docchain-api

API REST do DocChain.

**Stack:** NestJS 11, Prisma 6, PostgreSQL 16, ethers v6, bcrypt, passport-jwt, class-validator, prom-client, Jest.

## Setup

```bash
npm ci
cp .env.example .env   # ver tabela de variáveis na Wiki > Deploy

# Postgres (compose da raiz do repositório)
docker compose -f ../docker-compose.yml up -d postgres

npx prisma migrate deploy
npx prisma db seed     # opcional: demo@docchain.dev / DocChain@2026
```

## Rodando

```bash
npm run start:dev                     # watch
npm run build && npm run start:prod   # produção
```

| Recurso | URL |
| --- | --- |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/health |
| Métricas Prometheus | http://localhost:3000/metrics |

## Endpoints

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/auth/register` | pública | Cria usuário |
| POST | `/auth/login` | pública | Emite cookie `access_token` (`HttpOnly`, `SameSite=Lax`, 15 min) |
| POST | `/auth/logout` | cookie | Limpa o cookie |
| GET | `/auth/me` | cookie | Usuário autenticado |
| PATCH | `/auth/me` | cookie | Atualiza perfil |
| GET | `/auth/me/export` | cookie | Exporta os dados do usuário (LGPD) |
| DELETE | `/auth/me` | cookie | Exclui a conta (LGPD) |
| POST | `/documents` | cookie | Upload: hash, criptografia e registro on-chain |
| GET | `/documents` | cookie | Lista paginada (`page`, `limit`, `status`, `includeVersions`) com `versionCount` |
| GET | `/documents/:id` | cookie | Detalhe |
| DELETE | `/documents/:id` | cookie | Soft-delete e remoção do arquivo cifrado |
| GET | `/documents/:id/download` | cookie | Arquivo original descriptografado |
| POST | `/documents/:id/versions` | cookie | Nova versão ligada ao documento |
| GET | `/documents/:id/versions` | cookie | Linha do tempo de versões |
| POST | `/documents/:id/share` | cookie | Compartilha por email com comprovante |
| POST | `/documents/verify` | cookie | Verificação privada reenviando o arquivo |
| GET | `/verify/public/:hash` | pública | Verificação pública na blockchain |
| GET | `/health` | pública | Banco e blockchain |
| GET | `/metrics` | `METRICS_TOKEN` opcional | Métricas Prometheus |

Erros seguem o formato do `AllExceptionsFilter` (`statusCode`, `message`, `error`, `path`, `timestamp`). Upload de hash já registrado retorna 409 `DOCUMENT_ALREADY_REGISTERED` com `verifyUrl`.

## Testes

```bash
npm test             # unitários
npm run test:cov     # cobertura (threshold 75%)
E2E_HARDHAT=1 npm run test:e2e   # E2E contra Hardhat local, ver test/README.md
```

## Estrutura

```
src/
├── audit/          trilha de auditoria
├── auth/           cadastro, login, conta, LGPD
├── blockchain/     ethers v6, retry e RPC de fallback, ABI
├── common/         filtro global de exceções, contexto de requisição
├── crypto/         SHA-256 e AES-256-GCM
├── documents/      upload, listagem, versões, download, exclusão
├── health/         health check
├── mailer/         envio de email
├── metrics/        Prometheus (middleware, gauge, /metrics)
├── pdf/            comprovante em PDF com QR code
├── prisma/         PrismaService
├── sharing/        compartilhamento por email
├── storage/        IStorageService e implementação local
├── verification/   verificação pública e privada
├── app.module.ts
└── main.ts
```
