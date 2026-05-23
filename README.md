# DocChain — Registro Documental com Blockchain

Plataforma **SaaS open-source** para registro, armazenamento e verificação de autenticidade de documentos digitais com prova de integridade em blockchain (Sepolia Testnet).

Construída com arquitetura e qualidade de produto real (criptografia AES-256-GCM em repouso, hash SHA-256 do arquivo original, API REST documentada, frontend responsivo, infra containerizada), e mantida **gratuita por escolha estratégica** — a permanência em testnet permite que qualquer pessoa audite o código, rode localmente ou contribua, sem barreiras de gas/billing.

## Arquitetura

```
docchain-web (Next.js 14)  →  docchain-api (NestJS)  →  Sepolia Testnet
         ↕                          ↕                        ↕
      Browser                  PostgreSQL              Smart Contract
                               Local Storage         DocumentRegistry
```

| Repositorio | Stack | Descricao |
|---|---|---|
| `docchain-contracts/` | Hardhat + Solidity | Smart Contract de registro on-chain |
| `docchain-api/` | NestJS + Prisma + PostgreSQL | Backend / API REST |
| `docchain-web/` | Next.js 14 + Tailwind + shadcn/ui | Frontend / interface do usuario |

## Pre-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) + Docker Compose
- [Git](https://git-scm.com/)
- Conta [MetaMask](https://metamask.io/) com ETH Sepolia (para fases futuras)
- RPC URL da [Infura](https://infura.io/) ou [Alchemy](https://www.alchemy.com/) para Sepolia (para fases futuras)

## Instalacao

### 1. Clonar o repositorio

```bash
git clone https://github.com/cursebearer/Projeto-Portifolio.git
cd Projeto-Portifolio
```

### 2. Instalar dependencias de cada projeto

```bash
# Smart Contracts
cd docchain-contracts
npm install
cd ..

# Backend
cd docchain-api
npm install
cd ..

# Frontend
cd docchain-web
npm install
cd ..
```

### 3. Configurar variaveis de ambiente

```bash
# Backend
cp docchain-api/.env.example docchain-api/.env

# Contracts (necessario apenas na Fase 1+)
cp docchain-contracts/.env.example docchain-contracts/.env

# Frontend
cp docchain-web/.env.local.example docchain-web/.env.local
```

Edite o `docchain-api/.env` com seus valores. Para desenvolvimento local, os valores padrao do PostgreSQL ja funcionam com o Docker Compose.

### 4. Subir o banco de dados

```bash
cd docchain-api
docker compose up -d
```

Isso inicia o PostgreSQL na porta `5432` com:
- Usuario: `docchain`
- Senha: `docchain`
- Banco: `docchain`

### 5. Aplicar o schema do banco

```bash
cd docchain-api
npx prisma migrate dev --name init
```

## Executando

### Backend (porta 3000)

```bash
cd docchain-api
npm run start:dev
```

### Frontend (porta 3000 do Next.js — ajuste a porta se conflitar)

```bash
cd docchain-web
npm run dev
```

### Verificar compilacao dos contratos

```bash
cd docchain-contracts
npx hardhat compile
```

## Estrutura do Projeto

```
Projeto-Portifolio/
├── planning/                  # Documentacao de arquitetura e specs
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   ├── SMART_CONTRACT.md
│   ├── API_SPEC.md
│   ├── FRONTEND_SPEC.md
│   └── CLAUDE_CODE_GUIDE.md
├── docchain-contracts/        # Hardhat + Solidity
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── docchain-api/              # NestJS + Prisma
│   ├── src/
│   ├── prisma/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── .env.example
├── docchain-web/              # Next.js 14
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (auth)/register/
│   │   ├── (dashboard)/dashboard/
│   │   ├── (dashboard)/upload/
│   │   ├── (dashboard)/documents/[id]/
│   │   └── verify/
│   ├── components/
│   ├── lib/
│   ├── store/
│   ├── types/
│   └── middleware.ts
└── README.md
```

## Portas (desenvolvimento local)

| Servico | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3001 |
| Backend (NestJS) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Swagger (API docs) | http://localhost:3000/api/docs |

## Roadmap

- [x] **Fase 0** — Setup e infraestrutura
- [ ] **Fase 1** — Smart Contract (DocumentRegistry)
- [ ] **Fase 2** — Backend NestJS (Auth, Crypto, Storage, Blockchain, Documents)
- [ ] **Fase 3** — Frontend Next.js (Login, Dashboard, Upload, Verificacao)
- [ ] **Fase 4** — Integracao e testes finais

## Licença

Projeto **open-source**. Este repositório também integra o Projeto Portifólio (Trabalho de Conclusão de Curso) da Católica SC.
