# DocChain API

Backend NestJS do DocChain — registro documental com blockchain.

**Stack:** NestJS 11, Prisma 6, PostgreSQL 16, bcrypt, JWT (passport-jwt), class-validator, ethers 6.

## Setup

```bash
npm install
cp .env.example .env
# edita .env — DATABASE_URL, JWT_SECRET (32+ chars), ENCRYPTION_KEY (64 hex), RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS

# Postgres
docker compose up -d

# Migrations
npx prisma migrate dev
```

## Rodando

```bash
# dev (watch mode)
npm run start:dev

# build de produção
npm run build && npm run start:prod
```

Backend sobe em `http://localhost:3000`.

## Endpoints implementados (Fase 2 Sessão 1)

| Método | Rota | Guarda | Descrição |
|---|---|---|---|
| POST | `/auth/register` | pública | Cria usuário (bcrypt) |
| POST | `/auth/login` | pública | Valida credenciais, emite cookie httpOnly com JWT |
| POST | `/auth/logout` | JwtAuthGuard | Limpa cookie |
| GET | `/auth/me` | JwtAuthGuard | Retorna user autenticado |

Cookie: `Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax; Max-Age=900` (`Secure` em produção).

## Testes manuais

```bash
# Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@x.com","password":"12345678","name":"Teste"}'

# Login (salva cookie)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@x.com","password":"12345678"}' \
  -c cookies.txt -i

# Rota protegida
curl http://localhost:3000/auth/me -b cookies.txt

# Logout
curl -X POST http://localhost:3000/auth/logout -b cookies.txt -c cookies.txt -i
```

## Inspecionar banco

```bash
npx prisma studio   # GUI em http://localhost:5555
```

## Estrutura

```
src/
├── auth/
│   ├── decorators/current-user.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/jwt-auth.guard.ts
│   ├── strategies/jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── blockchain/
│   └── abi/DocumentRegistry.json   # exportado da Fase 1
├── prisma/
│   ├── prisma.module.ts            # global
│   └── prisma.service.ts
├── app.module.ts                    # ConfigModule + Prisma + Auth
└── main.ts                          # cookie-parser + ValidationPipe global
```

## Roadmap Fase 2

- Sessão 1 — Prisma + AuthModule (register/login/logout/me) — CONCLUÍDA
- Sessão 2 — CryptoService + StorageModule — CONCLUÍDA
- Sessão 3 — BlockchainModule — CONCLUÍDA
- Sessão 4 — DocumentsModule (upload/verify/download) — CONCLUÍDA
- Sessão 5 — Polish (Swagger, health, rate limit, logging estruturado) — CONCLUÍDA

Fase 2 completa. Ver `planning/ROADMAP.md` pra detalhes de cada sessão.
