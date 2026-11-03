# Deploy

## Pré-requisitos

- Node.js 24 e npm
- Docker Desktop (ou Docker Engine + Compose v2)
- Conta na Alchemy ou Infura (RPC da Sepolia) e carteira com ETH de teste
- Chave SMTP (Resend) para o compartilhamento por email

## Variáveis de ambiente da API

Copiar `docchain-api/.env.example` para `docchain-api/.env` e preencher:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL (o compose sobrescreve) |
| `JWT_SECRET` | sim | Mínimo 32 caracteres (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | sim | 32 bytes em hex, 64 caracteres. Perder a chave torna os arquivos ilegíveis |
| `RPC_URL` | sim | RPC principal da Sepolia |
| `RPC_FALLBACK_URLS` | não | RPCs extras separados por vírgula |
| `PRIVATE_KEY` | sim | Carteira que assina os registros |
| `CONTRACT_ADDRESS` | sim | `0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | sim | Envio de email |
| `CORS_ORIGIN` | sim em produção | URL do web |
| `VERIFY_PUBLIC_BASE_URL` | sim em produção | `<URL do web>/verify`, usado no QR code do comprovante |
| `METRICS_TOKEN` | recomendado em produção | Protege `GET /metrics` com Bearer token |
| `NODE_ENV` | sim em produção | `production` liga o cookie `Secure` e esconde stack traces |

No web, a única variável é `NEXT_PUBLIC_API_URL` (URL pública da API). Ela entra no bundle em tempo de build.

## Rodar tudo com Docker Compose

Na raiz do repositório:

```bash
docker compose up --build
```

| Serviço | URL |
| --- | --- |
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Métricas | http://localhost:3000/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 (admin / `GRAFANA_ADMIN_PASSWORD`, padrão `admin`) |

As migrations rodam no start da API (`prisma migrate deploy`). Para criar a conta de demonstração:

```bash
docker compose exec api npx prisma db seed
```

Conta padrão: `demo@docchain.dev` / `DocChain@2026` (mudar com `SEED_DEMO_EMAIL` e `SEED_DEMO_PASSWORD`).

## Rodar em modo desenvolvimento

```bash
# Banco
docker compose up -d postgres

# API
cd docchain-api
npm ci
npx prisma migrate deploy
npm run start:dev

# Web (outro terminal)
cd docchain-web
npm ci
cp .env.example .env.local
npm run dev -- -p 3001
```

## Produção

O Playbook da disciplina proíbe Vercel, Netlify, Render e Firebase e proíbe deploy manual por SSH ou FTP. O DocChain roda numa VM Linux em nuvem pública com Docker Compose, e o pipeline faz o deploy sozinho:

```
merge na main -> CI verde -> CD: imagens no GHCR -> SSH na VM -> docker compose pull && up -d -> health check
```

Arquivos em `deploy/`: `docker-compose.prod.yml` (postgres, api, web, caddy, prometheus, grafana), `Caddyfile` e `.env.example`. O passo a passo da VM e dos secrets do GitHub está em `deploy/README.md`.

| Item | Como fica |
| --- | --- |
| Domínio | Um domínio só. O Caddy manda `/api/*` para a API e o resto para o web, então o cookie `access_token` (host-only, `SameSite=Lax`) é visto pelo proxy do Next |
| HTTPS | Certificado automático do Let's Encrypt pelo Caddy. Necessário porque com `NODE_ENV=production` o cookie é `Secure` |
| Banco e storage | Volumes Docker persistentes na VM |
| Segredos | `.env` e `api.env` só na VM (`chmod 600`); chave SSH e host como secrets do GitHub |
| Email | Domínio verificado no Resend para o `SMTP_FROM` |
| Monitoramento | Prometheus coleta pela rede interna; Grafana em `/grafana/`; `/api/metrics` bloqueado por fora |
| Rollback | Fixar `IMAGE_TAG` com o SHA anterior e subir de novo |

Checklist depois do deploy (o CD já faz o primeiro):

1. `GET https://<domínio>/api/health` responde `status: ok` com banco e blockchain `up`.
2. Cadastro, login e upload de um arquivo pequeno até `CONFIRMED`.
3. `/verify` com o mesmo arquivo mostra "Autêntico".
4. Grafana mostra a API no ar.
