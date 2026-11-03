# DocChain

Plataforma web de registro documental com prova de integridade em blockchain.

O usuário envia um arquivo; o DocChain calcula o hash SHA-256, guarda o arquivo cifrado com AES-256-GCM e registra o hash no smart contract `DocumentRegistry` na rede Sepolia. Qualquer pessoa pode depois confirmar, sem login, que um arquivo é idêntico ao registrado e quando ele foi registrado.

Projeto Portfólio (TCC) de Engenharia de Software da Católica SC.

Documentação completa na [Wiki](https://github.com/cursebearer/Projeto-Portifolio/wiki) (fonte em `docs/wiki/`).

## Funcionalidades

- Cadastro e login com JWT em cookie `HttpOnly`
- Upload com hash SHA-256, criptografia AES-256-GCM e registro on-chain
- Dashboard com filtros, estatísticas e contador de versões
- Detalhe do documento com link para o Etherscan, download e exclusão (soft-delete)
- Versionamento de documentos
- Verificação pública por arquivo ou hash, sem conta
- Compartilhamento por email com comprovante em PDF e QR code
- Conta: editar perfil, exportar dados e excluir conta (LGPD)
- Métricas Prometheus e dashboard Grafana

## Arquitetura

```
docchain-web (Next.js)  ->  docchain-api (NestJS)  ->  Sepolia (DocumentRegistry)
                                 |        |
                            PostgreSQL  Storage cifrado
                                 ^
                     Prometheus -> Grafana
```

| Pasta | Stack | Descrição |
| --- | --- | --- |
| `docchain-contracts/` | Solidity 0.8.24, Hardhat | Smart contract de registro |
| `docchain-api/` | NestJS 11, Prisma 6, PostgreSQL 16, ethers v6 | API REST |
| `docchain-web/` | Next.js 16, React 19, Tailwind 4, shadcn/ui | Interface |
| `monitoring/` | Prometheus, Grafana | Coleta de métricas, alertas e dashboard |
| `docs/wiki/` | Markdown | Fonte das páginas da Wiki |

Contrato na Sepolia: [`0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e`](https://sepolia.etherscan.io/address/0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e)

## Rodar com Docker Compose

Pré-requisitos: Docker com Compose v2, RPC da Sepolia (Alchemy ou Infura), carteira com ETH de teste e chave SMTP.

```bash
git clone https://github.com/cursebearer/Projeto-Portifolio.git
cd Projeto-Portifolio
cp docchain-api/.env.example docchain-api/.env   # preencher os valores
docker compose up --build
```

Conta de demonstração (opcional):

```bash
docker compose exec api npx prisma db seed   # demo@docchain.dev / DocChain@2026
```

| Serviço | URL |
| --- | --- |
| Web | http://localhost:3001 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3002 |

## Rodar em modo desenvolvimento

```bash
docker compose up -d postgres

cd docchain-api
npm ci
npx prisma migrate deploy
npm run start:dev

# outro terminal
cd docchain-web
npm ci
cp .env.example .env.local
npm run dev -- -p 3001
```

Variáveis de ambiente, produção e checklist de deploy: [Wiki > Deploy](https://github.com/cursebearer/Projeto-Portifolio/wiki/Deploy).

## Testes

```bash
cd docchain-contracts && npm test
cd docchain-api && npm run test:cov
cd docchain-web && npm run test:cov
```

O CI (GitHub Actions) roda lint, build, testes com cobertura, SonarCloud e `npm audit` em todo pull request. Detalhes em [Wiki > Qualidade e Testes](https://github.com/cursebearer/Projeto-Portifolio/wiki/Qualidade-e-Testes).

## Estrutura

```
Projeto-Portifolio/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── sonar-project.properties
├── docchain-contracts/   contracts/, scripts/, test/, deployments/
├── docchain-api/         src/, prisma/, test/, Dockerfile
├── docchain-web/         app/, components/, lib/, store/, types/, Dockerfile
├── monitoring/           prometheus.yml, alerts.yml, grafana/
├── docs/wiki/            páginas da Wiki
├── planning/             specs e roadmap
└── RFC docs/             RFC aprovada e artefatos visuais
```
