# Qualidade e Testes

## Estratégia

| Projeto | Ferramenta | Tipo | Meta |
| --- | --- | --- | --- |
| `docchain-contracts` | Hardhat + chai | Unitário do contrato | 100% (RNF19) |
| `docchain-api` | Jest + ts-jest | Unitário de services, controllers, guards, filtros | 75% (threshold no `jest.config.ts`) |
| `docchain-api` | Jest + supertest | E2E real contra Hardhat local (`E2E_HARDHAT=1`) | fluxo upload, verificação |
| `docchain-web` | Vitest + Testing Library | Componentes, páginas, lib | 25% exigido; threshold atual 50% |

Os testes são escritos junto com cada funcionalidade: todo arquivo novo de service ou controller entra com o `.spec.ts` correspondente.

## Comandos

```bash
# Contrato
cd docchain-contracts && npm test && npm run coverage

# API
cd docchain-api && npm test && npm run test:cov

# E2E da API contra Hardhat (ver docchain-api/test/README.md)
cd docchain-api && E2E_HARDHAT=1 npm run test:e2e

# Web
cd docchain-web && npm test && npm run test:cov
```

## Integração contínua (`.github/workflows/ci.yml`)

Roda em todo pull request e em push na `main`:

| Job | Etapas |
| --- | --- |
| Contracts | `npm ci`, compile, testes |
| API | `npm ci`, `prisma generate`, lint, build, testes com cobertura (falha abaixo de 75%) |
| Web | `npm ci`, lint, testes com cobertura, build |
| E2E (API + Hardhat) | Postgres como service, `hardhat node`, deploy local, fluxo register → upload → CONFIRMED → verificação pública |
| Docker | Build das imagens da API e do web, smoke test do web e validação do `docker-compose.yml` |
| SonarCloud | Análise estática com a cobertura de API e web; espera o Quality Gate |
| npm audit | Falha com vulnerabilidade high ou critical em dependências de produção |

Dependabot abre PRs semanais de atualização para os três projetos.

## Entrega contínua (`.github/workflows/cd.yml`)

Quando o CI passa na `main`, o CD publica as imagens `ghcr.io/cursebearer/docchain-api` e `ghcr.io/cursebearer/docchain-web` com as tags `latest` e o SHA curto do commit. A URL pública da API usada no build do web vem da variável de repositório `NEXT_PUBLIC_API_URL`. O passo de deploy no provedor de nuvem entra nesse workflow quando a hospedagem for definida.

## SonarCloud

Configuração em `sonar-project.properties` na raiz. O job usa o secret `SONAR_TOKEN`; sem ele a etapa é pulada com aviso.

Para ativar:

1. Importar o repositório em https://sonarcloud.io com a conta do GitHub.
2. Em Administration > Analysis Method, desligar Automatic Analysis.
3. Gerar um token e salvar como secret `SONAR_TOKEN` no repositório.
4. Conferir se `sonar.organization` e `sonar.projectKey` batem com os mostrados no SonarCloud.

## Revisão de código

- Toda mudança entra por pull request.
- PR só é mergeado com CI verde.
