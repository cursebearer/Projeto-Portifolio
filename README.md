# DocChain

[![CI](https://github.com/cursebearer/Projeto-Portifolio/actions/workflows/ci.yml/badge.svg)](https://github.com/cursebearer/Projeto-Portifolio/actions/workflows/ci.yml)
[![CD](https://github.com/cursebearer/Projeto-Portifolio/actions/workflows/cd.yml/badge.svg)](https://github.com/cursebearer/Projeto-Portifolio/actions/workflows/cd.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=cursebearer_Projeto-Portifolio&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=cursebearer_Projeto-Portifolio)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=cursebearer_Projeto-Portifolio&metric=coverage)](https://sonarcloud.io/summary/new_code?id=cursebearer_Projeto-Portifolio)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=cursebearer_Projeto-Portifolio&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=cursebearer_Projeto-Portifolio)

Plataforma web de registro documental com prova de integridade em blockchain.

O usuário envia um arquivo; o DocChain calcula o hash SHA-256, guarda o arquivo cifrado com AES-256-GCM e registra o hash no smart contract `DocumentRegistry` na rede Sepolia. Qualquer pessoa pode depois confirmar, sem login, que um arquivo é idêntico ao registrado e quando ele foi registrado.

Projeto Portfólio (TCC) de Engenharia de Software da Católica SC, por Rafael Pavesi dos Passos.

| Documento | Onde |
| --- | --- |
| Wiki (arquitetura, requisitos, casos de uso, deploy, monitoramento, qualidade) | [Wiki](https://github.com/cursebearer/Projeto-Portifolio/wiki) (fonte em `docs/wiki/`) |
| RFC do projeto (versão atual) | [`RFC docs/RFC_DocChain 1.3.md`](<RFC docs/RFC_DocChain 1.3.md>) |
| RFC aprovada (versão 1.2) | [`RFC docs/`](<RFC docs/>) |
| Documentação da API | Swagger em `/api/docs` |
| Planejamento e roadmap | [`planning/`](planning/) |

## O problema

Quem entrega um contrato, balanço ou declaração em formato digital não tem como provar, depois, qual era o conteúdo original. O DocChain registra a impressão digital (hash) do arquivo em uma blockchain pública: o registro não pode ser alterado nem apagado, nem pelo próprio DocChain, e qualquer pessoa consegue conferir a autenticidade sozinha, inclusive pelo Etherscan.

## Funcionalidades

- Cadastro e login com JWT em cookie `HttpOnly` e sessão deslizante
- Upload com hash SHA-256, criptografia AES-256-GCM e registro on-chain, com rollback em caso de falha
- Dashboard com filtros, estatísticas e contador de versões
- Detalhe do documento com link para o Etherscan, download, verificação de integridade e exclusão (soft-delete)
- Versionamento de documentos (ex.: versão sem assinatura e versão assinada), cada versão com registro on-chain próprio
- Verificação pública sem conta, por arquivo (hash calculado no navegador) ou por hash, com link direto `/verify/<hash>`
- Compartilhamento por e-mail com o arquivo e um comprovante em PDF com QR code
- Minha conta: editar perfil, exportar dados e excluir conta (LGPD), com Termos de Uso e Política de Privacidade
- Trilha de auditoria das ações sensíveis
- Métricas Prometheus, dashboard Grafana e alertas

## Arquitetura

```
                      Caddy (HTTPS, produção)
                    /           |            \
     docchain-web (Next.js)   /api/*        /grafana/*
                    \           |               |
                     docchain-api (NestJS)   Grafana
                    /      |       |    \         |
          PostgreSQL  Storage   Sepolia  SMTP   Prometheus
                      cifrado  (DocumentRegistry)   (coleta /metrics)
```

| Pasta | Stack | Descrição |
| --- | --- | --- |
| `docchain-contracts/` | Solidity 0.8.24, Hardhat | Smart contract de registro |
| `docchain-api/` | NestJS 11, Prisma 6, PostgreSQL 16, ethers v6 | API REST |
| `docchain-web/` | Next.js 16, React 19, Tailwind 4, shadcn/ui, Zustand | Interface |
| `monitoring/` | Prometheus, Grafana | Coleta de métricas, alertas e dashboard |
| `deploy/` | Docker Compose, Caddy | Stack de produção e guia de deploy |
| `docs/wiki/` | Markdown | Fonte das páginas da Wiki |

Contrato na Sepolia, verificado no Etherscan: [`0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e`](https://sepolia.etherscan.io/address/0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e#code)

## Rodar com Docker Compose

Pré-requisitos: Docker com Compose v2, RPC da Sepolia (Alchemy ou Infura), carteira com ETH de teste e chave SMTP.

```bash
git clone https://github.com/cursebearer/Projeto-Portifolio.git
cd Projeto-Portifolio
cp docchain-api/.env.example docchain-api/.env   # preencher os valores
docker compose up --build
```

A API aplica as migrations do banco antes de iniciar.

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
| Grafana | http://localhost:3002 (`admin` / `admin`) |

### Comandos do dia a dia

Sempre na pasta raiz do projeto:

| Ação | Comando |
| --- | --- |
| Ligar tudo (banco, API, site, Prometheus e Grafana) | `docker compose up -d` |
| Desligar tudo (os dados continuam salvos) | `docker compose down` |
| Ver o que está rodando | `docker compose ps` |
| Aplicar mudanças no código | `docker compose up -d --build` |
| Acompanhar os logs da API | `docker compose logs -f api` |

Não use `docker compose down -v`: o `-v` apaga os volumes, ou seja, o banco e os arquivos enviados.

O Prometheus coleta as métricas da API dentro da rede do Docker. Se a API estiver rodando fora do Docker (modo desenvolvimento abaixo), o Grafana fica sem dados.

## Rodar em modo desenvolvimento

Para programar com recarga automática, só o banco roda no Docker e a API e o site rodam com `npm`. Antes, desligue a API e o site do Docker (`docker compose down`) para liberar as portas 3000 e 3001.

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

## Testes e qualidade

```bash
cd docchain-contracts && npm test
cd docchain-api && npm run test:cov     # unitários
cd docchain-api && npm run test:e2e     # ponta a ponta (Postgres + Hardhat local)
cd docchain-web && npm run test:cov
```

| Projeto | Cobertura de linhas | Testes | Meta |
| --- | --- | --- | --- |
| API | 99% | 213 | 75% (bloqueante no CI) |
| Web | 66% | 72 | 25% |
| Contrato | 100% | | |

Medido em 11/2026. Detalhes em [Wiki > Qualidade e Testes](https://github.com/cursebearer/Projeto-Portifolio/wiki/Qualidade-e-Testes).

## CI/CD

- **CI** (`.github/workflows/ci.yml`), em todo push e pull request: lint, testes com cobertura (API, Web e contrato), E2E com blockchain local, build das imagens Docker, SonarCloud com Quality Gate e `npm audit`. A `main` é protegida e só aceita merge com os 10 checks aprovados.
- **CD** (`.github/workflows/cd.yml`), após o CI na `main`: publica as imagens no GitHub Container Registry e atualiza o servidor de produção por SSH, com verificação de saúde no final e rollback pela tag do commit anterior.

Produção, variáveis de ambiente e rollback: [`deploy/README.md`](deploy/README.md) e [Wiki > Deploy](https://github.com/cursebearer/Projeto-Portifolio/wiki/Deploy).

## Estrutura

```
Projeto-Portifolio/
├── .github/workflows/    ci.yml, cd.yml
├── docker-compose.yml    stack de desenvolvimento
├── sonar-project.properties
├── docchain-contracts/   contracts/, scripts/, test/, deployments/
├── docchain-api/         src/, prisma/, test/, Dockerfile
├── docchain-web/         app/, components/, lib/, store/, types/, Dockerfile
├── deploy/               docker-compose.prod.yml, Caddyfile, guia de deploy
├── monitoring/           prometheus.yml, alerts.yml, grafana/
├── docs/wiki/            páginas da Wiki
├── planning/             specs e roadmap
└── RFC docs/             RFCs e artefatos visuais
```
