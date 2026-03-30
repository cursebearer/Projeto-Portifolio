# Guia de Implementação com Claude Code — DocChain

## Como usar este arquivo

Este guia define a **ordem exata** de implementação e os **prompts otimizados** para usar com o Claude Code (pago) em cada etapa. Siga a sequência — cada fase depende da anterior.

**Regra geral ao usar Claude Code:**
1. Sempre abra o Claude Code na raiz do repositório correto antes de iniciar
2. Forneça o contexto do arquivo de planejamento relevante no início de cada sessão
3. Peça um módulo por sessão — não misture responsabilidades
4. Após cada módulo, teste antes de avançar

---

## Fase 0 — Setup (1 sessão)

### Repositório: `docchain-contracts`

**Prompt inicial:**
```
Cria um projeto Hardhat com TypeScript para o repositório docchain-contracts.

Estrutura esperada:
- hardhat.config.ts com rede sepolia e rede hardhat local
- TypeScript configurado com strict mode
- @nomicfoundation/hardhat-toolbox instalado
- .env.example com: SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY
- .gitignore adequado (ignorar artifacts/, typechain-types/, node_modules/, .env)
- tsconfig.json compatível com Hardhat

Usa as versões:
- hardhat: ^2.22.0
- @nomicfoundation/hardhat-toolbox: ^5.0.0
- ethers: ^6.11.0

Não crie nenhum contrato ainda — só o setup do projeto.
```

### Repositório: `docchain-api`

**Prompt:**
```
Cria um projeto NestJS com TypeScript para o repositório docchain-api.

Requisitos:
- NestJS CLI com: @nestjs/config, @nestjs/jwt, @nestjs/passport, @nestjs/swagger, @nestjs/throttler
- Prisma instalado e inicializado com provider PostgreSQL
- .env.example com todas as variáveis (ver TECH_STACK.md)
- docker-compose.yml com serviço postgres:16-alpine na porta 5432
- Dockerfile multi-stage para produção
- .gitignore adequado (ignorar uploads/, .env, dist/)
- AppModule com ConfigModule.forRoot({ isGlobal: true, validationSchema com joi })

Versões exatas: ver TECH_STACK.md
Não crie nenhum módulo de negócio ainda.
```

### Repositório: `docchain-web`

**Prompt:**
```
Cria um projeto Next.js 14 com App Router para o repositório docchain-web.

Requisitos:
- TypeScript strict mode
- Tailwind CSS configurado
- shadcn/ui inicializado com tema padrão
- Instalar: axios, zustand, react-dropzone, sonner, lucide-react
- .env.local.example com: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_NETWORK_NAME, NEXT_PUBLIC_ETHERSCAN_BASE_URL
- Estrutura de pastas conforme FRONTEND_SPEC.md
- middleware.ts de proteção de rotas (ver FRONTEND_SPEC.md)

Não crie nenhuma página de conteúdo ainda — só layout base e middleware.
```

---

## Fase 1 — Smart Contract (2 sessões)

### Sessão 1: Escrever e testar o contrato

**Prompt:**
```
Contexto: estou construindo um sistema SaaS de registro documental com blockchain.
Leia o arquivo planning/SMART_CONTRACT.md para entender o contrato.

Cria os seguintes arquivos no projeto docchain-contracts:

1. contracts/DocumentRegistry.sol — exatamente conforme a especificação em SMART_CONTRACT.md
   - Struct DocumentRecord com campos: documentHash, storageRef, registeredBy, timestamp, exists
   - Mapping private _records
   - Evento DocumentRegistered (documentHash indexed, storageRef, registeredBy indexed, timestamp)
   - Erros customizados: InvalidHash, DocumentAlreadyRegistered, EmptyStorageRef
   - Função registerDocument(bytes32, string calldata) external
   - Função verifyDocument(bytes32) external view returns (DocumentRecord memory)
   - Função isRegistered(bytes32) external view returns (bool)
   - Variável pública totalDocuments
   - NatSpec em todas as funções

2. test/DocumentRegistry.test.ts — todos os testes conforme SMART_CONTRACT.md
   - Usar chai + ethers do hardhat-toolbox
   - Cobrir: registro com sucesso, evento emitido, revert em duplicata, revert em hash zero, revert em storageRef vazio, verifyDocument retorna dados corretos, verifyDocument retorna exists=false para hash inexistente

Depois mostra o resultado de: npx hardhat test
```

### Sessão 2: Deploy e exportação

**Prompt:**
```
Contexto: contrato DocumentRegistry.sol está pronto e testado.

Cria:
1. scripts/deploy.ts — conforme SMART_CONTRACT.md
   - Faz deploy na rede especificada
   - Salva endereço + ABI em artifacts/deployment.json
   - Imprime instruções pós-deploy

2. scripts/exportAbi.ts — copia a ABI de artifacts/deployment.json para
   ../docchain-api/src/blockchain/abi/DocumentRegistry.json
   (com verificação se o arquivo de destino existe)

Depois fornece as instruções exatas para:
- Conseguir ETH Sepolia no faucet
- Configurar o .env com Infura/Alchemy
- Executar o deploy
- Verificar no Etherscan Sepolia
```

---

## Fase 2 — Backend NestJS (5 sessões)

### Sessão 1: Prisma Schema + AuthModule

**Prompt:**
```
Contexto: backend NestJS do DocChain. Leia planning/DATABASE_SCHEMA.md e planning/API_SPEC.md.

Implementa em ordem:

1. prisma/schema.prisma — schema completo conforme DATABASE_SCHEMA.md
   - Enums: DocumentStatus, StorageType
   - Models: User, Document com todos os campos e relacionamentos
   - Índices em userId, hash, status

2. PrismaModule + PrismaService (src/prisma/) — módulo global com onModuleInit/onModuleDestroy

3. AuthModule completo (src/auth/):
   - RegisterDto e LoginDto com class-validator
   - AuthService: register() com bcrypt, login() com JWT
   - JwtStrategy (passport-jwt) validando userId do payload
   - JwtAuthGuard
   - Decorador @CurrentUser()
   - AuthController: POST /auth/register, POST /auth/login
   - AuthModule registrado no AppModule

Após criar, mostra como testar com curl:
- POST /auth/register
- POST /auth/login
```

### Sessão 2: CryptoService + StorageModule

**Prompt:**
```
Contexto: backend DocChain. Auth já funciona.

Implementa:

1. CryptoService (src/crypto/crypto.service.ts) como provider global:
   - hashFile(buffer: Buffer): string
     → SHA-256 usando crypto nativo do Node.js, retorna hex string de 64 chars
   - encrypt(buffer: Buffer): { ciphertext: Buffer, iv: string, authTag: string }
     → AES-256-GCM, IV aleatório de 16 bytes
     → Chave vem de process.env.ENCRYPTION_KEY (32 bytes em hex)
     → Retorna ciphertext como Buffer, iv e authTag como strings hex
   - decrypt(ciphertext: Buffer, iv: string, authTag: string): Buffer
     → Inverte o encrypt

2. StorageModule (src/storage/):
   - Interface IStorageService com save(buffer, filename) e retrieve(ref)
   - LocalStorageService implementando a interface:
     → save: salva o buffer em UPLOAD_DIR/{filename}.enc, retorna o path relativo
     → retrieve: lê o arquivo e retorna Buffer
   - StorageModule exportando o service via token 'STORAGE_SERVICE'

3. Testes unitários para CryptoService:
   - hashFile sempre retorna 64 chars hex
   - encrypt/decrypt são inversas (round-trip)
   - encrypt com mesmo input e IV diferente gera ciphertext diferente

Importante: o hash é calculado do arquivo ORIGINAL (antes de criptografar).
```

### Sessão 3: BlockchainModule

**Prompt:**
```
Contexto: backend DocChain. Crypto e Storage funcionando.
ABI do contrato está em: src/blockchain/abi/DocumentRegistry.json

Implementa BlockchainModule (src/blockchain/):

1. BlockchainService:
   - Inicializa ethers.JsonRpcProvider com RPC_URL do env
   - Inicializa Wallet com PRIVATE_KEY do env
   - Carrega o contrato DocumentRegistry via ABI + CONTRACT_ADDRESS
   - Método registerDocument(hash: string, storageRef: string): Promise<RegisterResult>
     → Converte hash hex string para bytes32: ('0x' + hash) as `0x${string}`
     → Chama contract.registerDocument(hashBytes32, storageRef)
     → Aguarda 1 confirmação com receipt = await tx.wait(1)
     → Retorna { txHash, blockNumber, walletAddress }
   - Método verifyDocument(hash: string): Promise<VerifyResult>
     → Converte hash para bytes32
     → Chama contract.verifyDocument(hashBytes32) — view, sem tx
     → Retorna { exists, documentHash, storageRef, registeredBy, timestamp }
   - Tratamento de erros: hash já registrado (DocumentAlreadyRegistered), timeout, etc.

2. BlockchainModule exportando BlockchainService

Inclui um método healthCheck() que verifica se a conexão com a RPC está ativa.
```

### Sessão 4: DocumentsModule — fluxo principal

**Prompt:**
```
Contexto: backend DocChain. Auth, Crypto, Storage e Blockchain funcionando.
Leia planning/API_SPEC.md para os contratos de request/response.

Implementa DocumentsModule (src/documents/) completo:

1. DTOs:
   - DocumentResponseDto (todos os campos da tabela documents)
   - PaginatedDocumentsDto com meta { total, page, limit, totalPages }
   - VerifyDocumentDto com documentId? e hash? (ambos opcionais, um obrigatório)
   - VerificationResultDto

2. DocumentsService com os métodos:
   - create(file: Express.Multer.File, userId: string): Promise<DocumentResponseDto>
     → Fluxo: cria registro PENDING → hash → encrypt → storage → blockchain → atualiza CONFIRMED
     → Se falhar em qualquer etapa: atualiza status FAILED com errorMessage
   - findAll(userId, page, limit, status?): Promise<PaginatedDocumentsDto>
   - findOne(id, userId): Promise<DocumentResponseDto> — lança 404 se não encontrar
   - verify(dto: VerifyDocumentDto, file?: Express.Multer.File): Promise<VerificationResultDto>
   - getFileBuffer(id, userId): Promise<{ buffer: Buffer, document: Document }>
     → Recupera arquivo do storage e descriptografa

3. DocumentsController:
   - POST /documents com FileInterceptor (memoryStorage, 50MB)
   - GET /documents com query params page/limit/status
   - GET /documents/:id
   - POST /documents/verify com FileInterceptor opcional
   - GET /documents/:id/download → retorna StreamableFile

4. GET /verify/public/:hash → sem autenticação → consulta apenas blockchain

Todos os endpoints protegidos com JwtAuthGuard exceto /verify/public.
```

### Sessão 5: Finalização do backend

**Prompt:**
```
Contexto: backend DocChain com todos os módulos implementados.

Finaliza o backend:

1. Filtro global de exceções (src/common/filters/http-exception.filter.ts)
   → Formato padronizado: { statusCode, message, timestamp }

2. Health check (GET /health):
   → Verifica: database (prisma.$queryRaw SELECT 1), blockchain (blockchainService.healthCheck())
   → Retorna status de cada serviço

3. Swagger configurado em main.ts (conforme API_SPEC.md)
   → BearerAuth adicionado
   → Decoradores @ApiTags, @ApiOperation, @ApiBearerAuth nos controllers

4. Rate limiting com @nestjs/throttler:
   → 100 requests / minuto global
   → POST /documents: 10 uploads / minuto por usuário

5. .env.example final com TODAS as variáveis, comentadas e com exemplos

6. Seed de demonstração (prisma/seed.ts) conforme DATABASE_SCHEMA.md

Testa o fluxo completo via Swagger UI em http://localhost:3000/api/docs
```

---

## Fase 3 — Frontend Next.js (4 sessões)

### Sessão 1: Auth + Layout base

**Prompt:**
```
Contexto: frontend docchain-web em Next.js 14 App Router.
Leia planning/FRONTEND_SPEC.md para estrutura e comportamento.

Implementa:

1. lib/api.ts — axios instance com interceptors (ver FRONTEND_SPEC.md)
2. store/auth.store.ts — Zustand store (ver FRONTEND_SPEC.md)
3. types/document.ts e types/user.ts — todos os tipos TypeScript
4. lib/utils.ts — truncateHash, formatFileSize, etherscanTxUrl, etherscanAddressUrl

5. Página /login com:
   - Formulário email + senha com validação
   - Call para POST /auth/login
   - Armazena token, atualiza store, redireciona para /dashboard
   - Toast de erro em falha (sonner)

6. Página /register com:
   - Formulário email + senha + nome
   - Call para POST /auth/register → auto-login após registro

7. Layout (app/(dashboard)/layout.tsx):
   - Sidebar com links: Dashboard, Upload, Verificar, Sair
   - Responsivo (sidebar vira drawer no mobile)
   - Exibe email do usuário logado

Usa shadcn/ui para todos os componentes de UI.
```

### Sessão 2: Dashboard + Upload

**Prompt:**
```
Contexto: frontend DocChain. Auth e layout base funcionando.

Implementa:

1. components/documents/StatusBadge.tsx — badge colorido por status (ver FRONTEND_SPEC.md)
2. components/documents/DocumentTable.tsx — tabela com colunas: nome, hash truncado, status, data, ação
3. Página /dashboard:
   - Cards de estatística (total, confirmados, pendentes)
   - DocumentTable com paginação
   - Botão "+ Novo Upload" redireciona para /upload
   - Chama GET /documents com page/limit
   - Loading skeleton enquanto carrega
   - Empty state se sem documentos

4. components/upload/UploadDropzone.tsx — react-dropzone estilizado
5. components/upload/UploadProgress.tsx — estados: idle → uploading → processing → confirming → success/error
6. Página /upload:
   - UploadDropzone + UploadProgress
   - Submit chama POST /documents
   - Em success: exibe hash + tx_hash + link Etherscan
   - Botão "Ver no Dashboard" após sucesso
```

### Sessão 3: Detalhe + Verificação

**Prompt:**
```
Contexto: frontend DocChain. Dashboard e upload funcionando.

Implementa:

1. components/documents/VerifyDropzone.tsx — dropzone inline para verificação
2. components/documents/VerificationResult.tsx — exibe resultado com ícone grande:
   - ✅ verde: "Documento Autêntico" com detalhes
   - ❌ vermelho: "Verificação Falhou" com razão

3. Página /documents/[id]:
   - Fetch GET /documents/:id
   - Grid 2 colunas: "Informações do Arquivo" | "Registro Blockchain"
   - Hash completo com botão copiar (clipboard API)
   - Link para Etherscan (abre nova aba)
   - Seção "Verificar Integridade" com VerifyDropzone inline
   - Botão Download (chama GET /documents/:id/download)
   - VerificationResult aparece abaixo após verificação

4. Página /verify (pública):
   - Sem layout do dashboard
   - Aceita arquivo OU hash digitado
   - Chama GET /verify/public/:hash
   - Exibe VerificationResult
```

### Sessão 4: Polish e integração final

**Prompt:**
```
Contexto: frontend DocChain com todas as páginas implementadas.

Finaliza o frontend:

1. Loading states em todas as operações assíncronas (Suspense + skeletons shadcn)
2. Error boundaries para erros inesperados
3. next.config.js com:
   - Configuração de domínios de imagem se necessário
   - Headers de segurança básicos

4. Revisa responsividade em todas as páginas (mobile-first)
5. Adiciona metadados de SEO básicos no layout raiz (title, description)
6. Adiciona feedback toast (sonner) em todas as ações: upload, verify, download, logout

7. Cria um README.md no docchain-web com:
   - Como instalar e rodar
   - Variáveis de ambiente necessárias
   - Screenshot ou GIF do fluxo principal (placeholder por enquanto)
```

---

## Fase 4 — Integração Final (1 sessão)

**Prompt:**
```
Contexto: todos os três repositórios implementados.

Finaliza a integração:

1. Atualiza docker-compose.yml do docchain-api para incluir o serviço web:
   - Serviço web buildando docchain-web
   - Configuração de variáveis de ambiente

2. Cria um script de setup inicial (setup.sh) na raiz de docchain-api:
   #!/bin/bash
   - docker compose up -d postgres
   - sleep 3
   - npx prisma migrate deploy
   - npx prisma db seed
   - echo "Setup concluído. Acesse http://localhost:3000"

3. README.md raiz em cada repositório com:
   - Badges de status (opcional)
   - Descrição clara
   - Pré-requisitos
   - Setup passo-a-passo
   - Como testar

4. Testa o fluxo completo containerizado e documenta qualquer ajuste necessário.
```

---

## Dicas para Sessões com Claude Code

### Contexto na abertura de cada sessão
Sempre comece com:
```
Estou construindo o DocChain — plataforma SaaS de registro documental com blockchain.
Stack: Next.js 14 / NestJS / Prisma / PostgreSQL / Hardhat / Solidity / Sepolia.
Estou na Fase X, Sessão Y. O planejamento completo está em planning/.
```

### Quando algo der errado
```
Esse erro aconteceu: [cole o erro completo]
Contexto: estávamos implementando [módulo]
O que estava tentando fazer: [descreva]
Não mude a arquitetura — só corrija o erro específico.
```

### Para iterações
```
O módulo X está funcionando. Agora preciso:
1. [tarefa específica]
Não refatore o que já funciona — só adicione o novo.
```

### Para revisão de código
```
Revisa o arquivo [caminho] e verifica:
- Está seguindo as convenções NestJS/Next.js?
- Tem algum problema de segurança óbvio?
- Os tipos TypeScript estão corretos?
Não reescreve o arquivo — só aponta os problemas.
```
