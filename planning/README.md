# DocChain — Plataforma de Registro Documental com Blockchain

> TCC / Portfólio — Protótipo funcional de SaaS para registro, armazenamento e verificação de autenticidade de documentos digitais com prova de integridade em blockchain.

---

## Visão Geral

O DocChain combina upload de arquivos, geração de hash criptográfico, criptografia de conteúdo, armazenamento seguro e registro on-chain em uma testnet EVM (Sepolia) para garantir rastreabilidade e auditabilidade de documentos digitais.

---

## Repositórios

| Repositório | Stack | Descrição |
|---|---|---|
| `docchain-web` | Next.js 14 + TypeScript + Tailwind | Frontend / interface do usuário |
| `docchain-api` | NestJS + Prisma + PostgreSQL | Backend / API REST |
| `docchain-contracts` | Hardhat + Solidity | Smart Contract de registro on-chain |

---

## Arquivos de Planejamento

```
planning/
├── README.md                  ← este arquivo (visão geral e navegação)
├── ARCHITECTURE.md            ← arquitetura do sistema e fluxo de dados
├── ROADMAP.md                 ← fases de desenvolvimento e entregas
├── TECH_STACK.md              ← decisões técnicas detalhadas com versões
├── DATABASE_SCHEMA.md         ← schema Prisma completo com anotações
├── SMART_CONTRACT.md          ← especificação e scaffold do contrato Solidity
├── API_SPEC.md                ← todos os endpoints NestJS documentados
├── FRONTEND_SPEC.md           ← páginas, componentes e fluxos Next.js
└── CLAUDE_CODE_GUIDE.md       ← guia de uso com Claude Code (ordem de implementação)
```

Leia os arquivos nesta sequência antes de iniciar qualquer implementação:
1. `ARCHITECTURE.md` — entenda o sistema como um todo
2. `ROADMAP.md` — saiba em qual fase você está
3. `TECH_STACK.md` — versões e configurações exatas
4. Os demais conforme o módulo sendo implementado

---

## Fluxo Principal do Sistema

```
Usuário faz upload
       ↓
Backend recebe e cria registro inicial no banco (status: PENDING)
       ↓
Hash SHA-256 é gerado do arquivo original
       ↓
Arquivo é criptografado (AES-256-GCM)
       ↓
Arquivo criptografado é salvo no storage (local → IPFS futuramente)
       ↓
Hash + referência de storage são registrados no Smart Contract (Sepolia)
       ↓
tx_hash + storage_ref salvos no banco (status: CONFIRMED)
       ↓
Dashboard exibe documento com status e provas
       ↓
Usuário pode reenviar arquivo → sistema recalcula hash e compara
com banco + blockchain para verificar autenticidade
```

---

## Escopo do TCC (Entrega Mínima)

- [x] Autenticação JWT (usuário único inicial)
- [x] Upload de documentos
- [x] Geração de hash SHA-256
- [x] Criptografia AES-256-GCM
- [x] Storage local (Fase 1)
- [x] Registro em Smart Contract na Sepolia
- [x] Persistência de metadados no PostgreSQL
- [x] Dashboard documental
- [x] Verificação de integridade (hash + blockchain)

## Escopo Futuro (SaaS)

- [ ] IPFS remoto com pinning
- [ ] Multiusuário e multiempresa
- [ ] Integração SAP/CPI via API
- [ ] Relatórios de auditoria
- [ ] Mainnet ou L2 EVM (Polygon, Arbitrum)

---

## Pré-requisitos de Ambiente

- Node.js 20+
- Docker + Docker Compose
- Conta MetaMask com ETH Sepolia (faucet gratuito)
- Infura ou Alchemy RPC URL (Sepolia)
- Variáveis de ambiente configuradas (ver `.env.example` em cada repo)
