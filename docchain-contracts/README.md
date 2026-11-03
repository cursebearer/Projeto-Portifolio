# docchain-contracts

Smart contract do DocChain. Guarda na blockchain a prova de existência de cada documento: o hash SHA-256 do arquivo, a referência de storage, quem registrou e quando. O conteúdo do arquivo nunca vai para a chain.

## Stack

- Solidity 0.8.24 (optimizer ligado, 200 runs)
- Hardhat 2 + hardhat-toolbox (ethers v6, chai, typechain, solidity-coverage)
- Rede pública de testes: Sepolia (chainId 11155111)

## Deploy atual

| Campo | Valor |
| --- | --- |
| Rede | Sepolia |
| Endereço | `0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e` |
| Tx de deploy | `0x8f4feb4f02ef810dd3762c7d99290c18c662811654ce9eb644f3f17bf3e8a09d` |
| Data | 2026-08-12 |

Explorer: https://sepolia.etherscan.io/address/0xEC85EB9bE437EeBA80ac1014dFf127615B20B88e

Os dados completos (endereço, deployer e ABI) ficam em `deployments/sepolia.json`.

## Contrato `DocumentRegistry`

### Estado

| Nome | Tipo | Descrição |
| --- | --- | --- |
| `_records` | `mapping(bytes32 => DocumentRecord)` | Registro por hash (privado, lido via `verifyDocument`) |
| `owner` | `address` | Quem fez o deploy |
| `totalDocuments` | `uint256` | Total de documentos registrados |

`DocumentRecord` = `documentHash`, `storageRef`, `registeredBy`, `timestamp`, `exists`.

### Funções

| Função | Tipo | Descrição |
| --- | --- | --- |
| `registerDocument(bytes32 hash, string storageRef)` | escrita | Registra o hash uma única vez. Emite `DocumentRegistered`. |
| `verifyDocument(bytes32 hash)` | view | Retorna o `DocumentRecord`; `exists = false` se não registrado. |
| `isRegistered(bytes32 hash)` | view | Atalho booleano. |

### Erros customizados

| Erro | Quando |
| --- | --- |
| `InvalidHash()` | Hash igual a `bytes32(0)` |
| `EmptyStorageRef()` | `storageRef` vazio |
| `DocumentAlreadyRegistered(bytes32)` | Hash já registrado (imutabilidade) |

### Evento

`DocumentRegistered(bytes32 indexed documentHash, string storageRef, address indexed registeredBy, uint256 timestamp)`

Decisões de projeto:

- Registro imutável: não existe função de update nem de delete. A versão nova de um documento é outro hash, e o encadeamento entre versões fica no banco da API.
- Erros customizados em vez de `require` com string, para gastar menos gas.
- Leitura (`verifyDocument`, `isRegistered`) é `view`, então qualquer pessoa verifica sem pagar gas e sem depender da API.
- O contrato não restringe quem chama `registerDocument`. Na arquitetura atual quem assina é a carteira do backend; `registeredBy` registra esse endereço.

## Como rodar

```bash
npm ci
cp .env.example .env   # só necessário para Sepolia
```

| Comando | O que faz |
| --- | --- |
| `npm run compile` | Compila e gera os tipos em `typechain-types/` |
| `npm test` | Roda os testes em `test/DocumentRegistry.test.ts` na rede Hardhat em memória |
| `npm run coverage` | Cobertura com solidity-coverage |
| `npx hardhat node` | Sobe uma chain local em `http://127.0.0.1:8545` |
| `npm run deploy:local` | Deploy na rede local (com `--network localhost` se o node estiver rodando) |
| `npm run deploy:sepolia` | Deploy na Sepolia e grava `deployments/sepolia.json` |
| `npm run export-abi` | Copia ABI e endereço para `../docchain-api/src/blockchain/abi/DocumentRegistry.json` |
| `npm run verify:sepolia -- <endereço>` | Publica o código-fonte no Etherscan |

### Variáveis de ambiente (`.env`)

| Variável | Uso |
| --- | --- |
| `SEPOLIA_RPC_URL` | RPC da Sepolia (Alchemy, Infura ou público) |
| `PRIVATE_KEY` | Chave da carteira de deploy, sem `0x` |
| `ETHERSCAN_API_KEY` | Necessária só para `verify:sepolia` |

A carteira precisa de ETH de teste da Sepolia (faucet) para pagar o deploy e os registros.

## Fluxo de atualização do contrato

1. Alterar `contracts/DocumentRegistry.sol` e os testes.
2. `npm test` e `npm run coverage`.
3. `npm run deploy:sepolia`.
4. `npm run export-abi` para atualizar a API.
5. Atualizar `CONTRACT_ADDRESS` no `.env` da API e do ambiente de produção.

Um deploy novo gera outro endereço com estado vazio. Os registros do contrato anterior continuam válidos no endereço antigo.
