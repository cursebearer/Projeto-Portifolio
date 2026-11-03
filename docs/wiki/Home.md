# DocChain

Plataforma web de registro documental com prova de integridade em blockchain. O usuário envia um arquivo, o sistema calcula o hash SHA-256, guarda o arquivo cifrado com AES-256-GCM e registra o hash em um smart contract na rede Sepolia. Depois, qualquer pessoa consegue confirmar que um arquivo é idêntico ao registrado, sem login e sem acesso ao conteúdo.

Trabalho de Conclusão de Curso de Engenharia de Software (Católica SC), linha Web.

## Páginas

| Página | Conteúdo |
| --- | --- |
| [Requisitos](Requisitos) | Requisitos funcionais, não funcionais e regras de negócio, com status |
| [Casos de Uso](Casos-de-Uso) | Atores, casos de uso e fluxos principais |
| [Arquitetura](Arquitetura) | Diagramas C4 (contexto, containers, componentes) e decisões |
| [Deploy](Deploy) | Como rodar local, com Docker Compose e em produção |
| [Monitoramento](Monitoramento) | Métricas Prometheus, dashboard Grafana e alertas |
| [Qualidade e Testes](Qualidade-e-Testes) | Estratégia de testes, cobertura, CI e SonarCloud |

## Visão rápida

| Camada | Tecnologia |
| --- | --- |
| Web | Next.js 16, React 19, Tailwind 4, shadcn/ui, Zustand |
| API | NestJS 11, Prisma 6, PostgreSQL 16, ethers v6 |
| Blockchain | Solidity 0.8.24, Hardhat, Sepolia |
| Infra | Docker Compose, GitHub Actions, Prometheus, Grafana |

Contrato na Sepolia: [`0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e`](https://sepolia.etherscan.io/address/0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e)

## Repositório

| Pasta | Conteúdo |
| --- | --- |
| `docchain-api/` | Backend REST (Swagger em `/api/docs`) |
| `docchain-web/` | Frontend |
| `docchain-contracts/` | Smart contract `DocumentRegistry` |
| `monitoring/` | Configuração do Prometheus e do Grafana |
| `docs/wiki/` | Fonte destas páginas |
