# Tech Stack — DocChain

## Versões Exatas (fixar no package.json)

### `docchain-contracts`
```json
{
  "devDependencies": {
    "hardhat": "^2.22.0",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "ethers": "^6.11.0",
    "typescript": "^5.4.0",
    "ts-node": "^10.9.0",
    "@typechain/hardhat": "^9.1.0",
    "@typechain/ethers-v6": "^0.5.0"
  }
}
```

### `docchain-api`
```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^5.1.0",
    "@prisma/client": "^5.12.0",
    "ethers": "^6.11.0",
    "bcrypt": "^5.1.0",
    "multer": "^1.4.5-lts.1",
    "passport-jwt": "^4.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "joi": "^17.12.0"
  },
  "devDependencies": {
    "prisma": "^5.12.0",
    "@types/bcrypt": "^5.0.0",
    "@types/multer": "^1.4.0",
    "@types/passport-jwt": "^4.0.0",
    "typescript": "^5.4.0"
  }
}
```

### `docchain-web`
```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "axios": "^1.6.0",
    "zustand": "^4.5.0",
    "react-dropzone": "^14.2.0",
    "sonner": "^1.4.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0"
  }
}
```
> shadcn/ui: instalar via CLI `npx shadcn-ui@latest init` — não entra no package.json diretamente

---

## Decisões de Stack Justificadas

### Por que NestJS no backend?
- Arquitetura modular obriga organização limpa (ótimo para TCC e para demonstrar boas práticas)
- Injeção de dependência nativa facilita testes unitários
- Integração nativa com Swagger, Passport, Throttler
- TypeScript first — mesma linguagem em toda a stack

### Por que Prisma como ORM?
- Schema declarativo em `schema.prisma` serve como documentação viva do banco
- Migrations automáticas — `npx prisma migrate dev` cuida de tudo
- Cliente totalmente tipado — autocompletar em todos os queries
- Excelente suporte a PostgreSQL

### Por que Ethers.js v6 (não Web3.js)?
- API mais moderna, menor bundle size
- Melhor suporte a TypeScript
- v6 tem melhor tratamento de BigInt nativo

### Por que AES-256-GCM para criptografia?
- GCM (Galois/Counter Mode) é **autenticado** — o `authTag` garante que o arquivo não foi adulterado em repouso
- Padrão da indústria para criptografia simétrica
- Node.js `crypto` nativo — sem dependência extra

### Por que SHA-256 para hash?
- Padrão amplamente aceito para integridade de arquivos
- Output de 256 bits (32 bytes) — cabe bem no mapping `bytes32` do Solidity
- Irreversível e determinístico — mesmo arquivo sempre gera mesmo hash

### Por que o hash é do arquivo ORIGINAL (não criptografado)?
- **Crítico para verificação:** o usuário reenvia o arquivo original para verificar
- Se hasheasemos o arquivo criptografado, a verificação precisaria descriptografar antes — complexidade desnecessária
- O arquivo criptografado no storage é protegido pela chave — o hash é só a impressão digital do conteúdo

---

## Variáveis de Ambiente

### `docchain-api/.env`
```env
# Banco de dados
DATABASE_URL="postgresql://docchain:docchain@localhost:5432/docchain"

# JWT
JWT_SECRET="seu-secret-aqui-minimo-32-chars"
JWT_EXPIRES_IN="15m"

# Criptografia de arquivos
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="sua-chave-hex-64-chars-aqui"

# Blockchain
RPC_URL="https://sepolia.infura.io/v3/SEU_PROJECT_ID"
PRIVATE_KEY="chave-privada-da-wallet-sem-0x"
CONTRACT_ADDRESS="0x..."
NETWORK="sepolia"

# Storage
STORAGE_TYPE="LOCAL"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=50

# App
PORT=3000
NODE_ENV="development"
```

### `docchain-contracts/.env`
```env
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/SEU_PROJECT_ID"
PRIVATE_KEY="chave-privada-da-wallet-sem-0x"
ETHERSCAN_API_KEY="sua-api-key-etherscan"
```

### `docchain-web/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_NETWORK_NAME="Sepolia Testnet"
NEXT_PUBLIC_ETHERSCAN_BASE_URL="https://sepolia.etherscan.io"
```

---

## Configuração do Hardhat

### `hardhat.config.ts`
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {}, // rede local para testes
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;
```

---

## Estrutura de Pastas de Cada Repositório

### `docchain-contracts/`
```
contracts/
  DocumentRegistry.sol
scripts/
  deploy.ts
  verify.ts
test/
  DocumentRegistry.test.ts
artifacts/           ← gerado pelo Hardhat (não commitar)
typechain-types/     ← gerado pelo Hardhat (não commitar)
.env
.env.example
hardhat.config.ts
package.json
tsconfig.json
```

### `docchain-api/`
```
src/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    strategies/
      jwt.strategy.ts
    guards/
      jwt-auth.guard.ts
    dto/
      login.dto.ts
      register.dto.ts
  documents/
    documents.module.ts
    documents.controller.ts
    documents.service.ts
    dto/
      create-document.dto.ts
      document-response.dto.ts
      verify-document.dto.ts
  blockchain/
    blockchain.module.ts
    blockchain.service.ts
    abi/
      DocumentRegistry.json
  storage/
    storage.module.ts
    storage.service.ts (interface)
    local-storage.service.ts
    ipfs-storage.service.ts (fase 2)
  crypto/
    crypto.service.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  common/
    decorators/
      current-user.decorator.ts
    filters/
      http-exception.filter.ts
  main.ts
  app.module.ts
prisma/
  schema.prisma
  migrations/
uploads/             ← volume Docker (gitignore)
.env
.env.example
docker-compose.yml
Dockerfile
package.json
```

### `docchain-web/`
```
app/
  (auth)/
    login/
      page.tsx
    register/
      page.tsx
  (dashboard)/
    layout.tsx
    dashboard/
      page.tsx
    upload/
      page.tsx
    documents/
      [id]/
        page.tsx
  verify/
    page.tsx
  layout.tsx
  page.tsx (redirect para /dashboard)
components/
  ui/                ← shadcn/ui components
  documents/
    DocumentTable.tsx
    DocumentCard.tsx
    StatusBadge.tsx
    VerifyDropzone.tsx
    VerificationResult.tsx
  upload/
    UploadDropzone.tsx
    UploadProgress.tsx
  layout/
    Sidebar.tsx
    Navbar.tsx
lib/
  api.ts             ← axios instance com interceptors
  utils.ts
store/
  auth.store.ts      ← Zustand
  documents.store.ts
types/
  document.ts
  user.ts
.env.local
.env.example
next.config.js
tailwind.config.ts
```

---

## Docker Compose (desenvolvimento)

```yaml
# docker-compose.yml (na raiz de docchain-api ou em pasta separada)
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: docchain
      POSTGRES_PASSWORD: docchain
      POSTGRES_DB: docchain
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://docchain:docchain@postgres:5432/docchain
    env_file: .env
    depends_on:
      - postgres
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```
