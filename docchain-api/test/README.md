# E2E — DocChain API

## Hardhat local E2E

**Fluxo coberto:** POST /documents → status CONFIRMED com txHash real em chain local Hardhat (sem gastar ETH testnet).

**Spec:** `documents.hardhat.e2e-spec.ts`
**Guarda:** só roda se `E2E_HARDHAT=1`. Sem a env, o describe pula (`describe.skip`).

### Pré-requisitos (manual)

1. Postgres rodando em `localhost:5432` com DB `docchain_e2e` (schema aplicado via `prisma db push`).
2. Hardhat node local escutando em `http://127.0.0.1:8545` (chainId 31337).
3. Contrato `DocumentRegistry` deployed na chain local; endereço + private key da conta 0 da hardhat em env vars.

### Setup

Em um terminal (fica aberto durante os testes):

```bash
cd docchain-contracts
npx hardhat node
```

Em outro terminal, deploy no node local (uma vez por sessão):

```bash
cd docchain-contracts
npx hardhat run scripts/deploy.ts --network localhost
# anote o endereço impresso
```

Hardhat usa as mesmas 20 contas determinísticas por default. Pegue a conta 0:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Prepare o Postgres de teste:

```bash
createdb docchain_e2e
cd docchain-api
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docchain_e2e?schema=public" npx prisma db push
```

Rodar E2E:

```bash
E2E_HARDHAT=1 \
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/docchain_e2e?schema=public" \
RPC_URL="http://127.0.0.1:8545" \
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
CONTRACT_ADDRESS="<endereço impresso pelo deploy>" \
JWT_SECRET="qualquer-string-de-32-chars-ou-mais-aqui-ok" \
ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
SMTP_HOST="smtp.example" SMTP_USER="x" SMTP_PASSWORD="x" SMTP_FROM="noreply@example.com" \
UPLOAD_DIR="./uploads-e2e" \
npm run test:e2e
```

### CI

Job `E2E (API + Hardhat)` em `.github/workflows/ci.yml`: sobe Postgres como service, roda `hardhat node` em background, faz o deploy local (o primeiro deploy da conta #0 sempre cai em `0x5FbDB2315678afecb367f032d93F642f64180aa3`), aplica as migrations e dispara o spec.
