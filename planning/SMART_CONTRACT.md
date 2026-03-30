# Smart Contract — DocumentRegistry

## Visão Geral

O contrato `DocumentRegistry` é o coração da prova on-chain do DocChain.
Ele armazena o hash de cada documento em um mapping imutável na Sepolia, garantindo que:
- O registro existe independente do backend
- Qualquer pessoa pode verificar a autenticidade chamando `verifyDocument`
- Nenhum hash pode ser sobrescrito (cada documento tem apenas um registro)
- Todos os registros emitem eventos auditáveis

---

## Contrato Completo

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocumentRegistry
 * @author DocChain
 * @notice Registra e verifica a integridade de documentos digitais via hash criptográfico.
 * @dev O hash é o SHA-256 do arquivo original (antes da criptografia),
 *      convertido para bytes32 no backend antes de chamar este contrato.
 */
contract DocumentRegistry {

    // ─────────────────────────────────────────────────────────────
    // Estruturas
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Dados armazenados para cada documento registrado.
     * @param documentHash  Hash SHA-256 do documento (bytes32)
     * @param storageRef    Referência de storage: path local ou CID IPFS
     * @param registeredBy  Endereço da wallet que fez o registro
     * @param timestamp     Timestamp Unix do bloco de registro
     * @param exists        Flag para distinguir hash não registrado de hash zerado
     */
    struct DocumentRecord {
        bytes32 documentHash;
        string  storageRef;
        address registeredBy;
        uint256 timestamp;
        bool    exists;
    }

    // ─────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────

    /// @notice Mapping do hash do documento para seu registro on-chain
    mapping(bytes32 => DocumentRecord) private _records;

    /// @notice Endereço do owner do contrato (quem fez o deploy)
    address public owner;

    /// @notice Contador total de documentos registrados
    uint256 public totalDocuments;

    // ─────────────────────────────────────────────────────────────
    // Eventos
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Emitido quando um documento é registrado com sucesso.
     * @param documentHash  Hash do documento (indexado para busca eficiente)
     * @param storageRef    Referência de onde o arquivo está armazenado
     * @param registeredBy  Quem registrou
     * @param timestamp     Quando foi registrado
     */
    event DocumentRegistered(
        bytes32 indexed documentHash,
        string          storageRef,
        address indexed registeredBy,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // Erros customizados (mais eficiente que require + string)
    // ─────────────────────────────────────────────────────────────

    /// @notice Hash inválido (bytes32 zerado)
    error InvalidHash();

    /// @notice Documento já registrado — imutabilidade garantida
    error DocumentAlreadyRegistered(bytes32 documentHash);

    /// @notice Referência de storage não pode ser vazia
    error EmptyStorageRef();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────
    // Funções principais
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Registra um documento na blockchain.
     * @dev    Apenas uma vez por hash — tentativas de sobrescrita revertem.
     *         O hash deve ser o SHA-256 do arquivo original em bytes32.
     * @param _documentHash  Hash SHA-256 do documento como bytes32
     * @param _storageRef    Referência de storage (path local ou CID IPFS)
     */
    function registerDocument(
        bytes32 _documentHash,
        string calldata _storageRef
    ) external {
        if (_documentHash == bytes32(0)) revert InvalidHash();
        if (bytes(_storageRef).length == 0) revert EmptyStorageRef();
        if (_records[_documentHash].exists) revert DocumentAlreadyRegistered(_documentHash);

        _records[_documentHash] = DocumentRecord({
            documentHash: _documentHash,
            storageRef:   _storageRef,
            registeredBy: msg.sender,
            timestamp:    block.timestamp,
            exists:       true
        });

        totalDocuments++;

        emit DocumentRegistered(
            _documentHash,
            _storageRef,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Verifica se um documento está registrado e retorna seus dados.
     * @dev    Função view — não gasta gas, pode ser chamada por qualquer pessoa.
     * @param _documentHash  Hash SHA-256 do documento como bytes32
     * @return record        Struct DocumentRecord com todos os dados
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (DocumentRecord memory record)
    {
        return _records[_documentHash];
    }

    /**
     * @notice Verifica rapidamente se um hash está registrado (booleano).
     * @param _documentHash  Hash do documento
     * @return               true se registrado, false caso contrário
     */
    function isRegistered(bytes32 _documentHash)
        external
        view
        returns (bool)
    {
        return _records[_documentHash].exists;
    }
}
```

---

## Conversão de Hash no Backend (NestJS)

O SHA-256 gerado pelo Node.js é uma string hex. Antes de enviar ao contrato,
é necessário converter para `bytes32` (formato que o Solidity espera):

```typescript
// src/blockchain/blockchain.service.ts
import { ethers } from 'ethers';

// hash é a string hex SHA-256 gerada pelo CryptoService
// ex: "a3f5c8d2e1b0..."  (64 chars = 32 bytes)
const hashAsBytes32 = ethers.hexlify(ethers.toBeHex('0x' + hash, 32));
// ou mais direto:
const hashAsBytes32 = ('0x' + hash) as `0x${string}`;

// Chamar o contrato
await contract.registerDocument(hashAsBytes32, storageRef);
```

---

## Script de Deploy

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying DocumentRegistry...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const contract = await DocumentRegistry.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("DocumentRegistry deployed to:", address);

  // Salvar endereço e ABI para uso no backend
  const artifact = {
    address,
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../artifacts/contracts/DocumentRegistry.sol/DocumentRegistry.json"),
        "utf8"
      )
    ).abi
  };

  fs.writeFileSync(
    path.join(__dirname, "../artifacts/deployment.json"),
    JSON.stringify(artifact, null, 2)
  );

  console.log("Deployment info saved to artifacts/deployment.json");
  console.log("\nNext steps:");
  console.log("1. Copy artifacts/deployment.json ABI to docchain-api/src/blockchain/abi/");
  console.log("2. Set CONTRACT_ADDRESS=" + address + " in docchain-api/.env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## Testes do Contrato

```typescript
// test/DocumentRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry } from "../typechain-types";

describe("DocumentRegistry", () => {
  let contract: DocumentRegistry;
  let owner: any;
  let addr1: any;

  // Hash de exemplo (32 bytes)
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("documento-de-teste.pdf"));
  const sampleStorageRef = "/uploads/abc123.enc";

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocumentRegistry");
    contract = await Factory.deploy();
  });

  describe("registerDocument", () => {
    it("deve registrar um documento com sucesso", async () => {
      await contract.registerDocument(sampleHash, sampleStorageRef);
      expect(await contract.isRegistered(sampleHash)).to.be.true;
    });

    it("deve emitir evento DocumentRegistered", async () => {
      await expect(contract.registerDocument(sampleHash, sampleStorageRef))
        .to.emit(contract, "DocumentRegistered")
        .withArgs(sampleHash, sampleStorageRef, owner.address, anyValue);
    });

    it("deve incrementar totalDocuments", async () => {
      await contract.registerDocument(sampleHash, sampleStorageRef);
      expect(await contract.totalDocuments()).to.equal(1n);
    });

    it("deve reverter com DocumentAlreadyRegistered ao registrar hash duplicado", async () => {
      await contract.registerDocument(sampleHash, sampleStorageRef);
      await expect(
        contract.registerDocument(sampleHash, sampleStorageRef)
      ).to.be.revertedWithCustomError(contract, "DocumentAlreadyRegistered");
    });

    it("deve reverter com InvalidHash para bytes32 zerado", async () => {
      await expect(
        contract.registerDocument(ethers.ZeroHash, sampleStorageRef)
      ).to.be.revertedWithCustomError(contract, "InvalidHash");
    });

    it("deve reverter com EmptyStorageRef para storageRef vazio", async () => {
      await expect(
        contract.registerDocument(sampleHash, "")
      ).to.be.revertedWithCustomError(contract, "EmptyStorageRef");
    });
  });

  describe("verifyDocument", () => {
    it("deve retornar dados corretos para hash registrado", async () => {
      await contract.connect(addr1).registerDocument(sampleHash, sampleStorageRef);
      const record = await contract.verifyDocument(sampleHash);

      expect(record.exists).to.be.true;
      expect(record.documentHash).to.equal(sampleHash);
      expect(record.storageRef).to.equal(sampleStorageRef);
      expect(record.registeredBy).to.equal(addr1.address);
    });

    it("deve retornar exists=false para hash não registrado", async () => {
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("inexistente"));
      const record = await contract.verifyDocument(unknownHash);
      expect(record.exists).to.be.false;
    });
  });
});
```

---

## Gas Estimado (Sepolia)

| Operação | Gas Estimado | Custo aprox. (0.5 gwei) |
|---|---|---|
| Deploy do contrato | ~400.000 | ~0.0002 ETH |
| `registerDocument` | ~80.000 | ~0.00004 ETH |
| `verifyDocument` (view) | 0 | Gratuito |
| `isRegistered` (view) | 0 | Gratuito |

> ETH Sepolia é gratuito via faucets (sepoliafaucet.com, faucets.chain.link)

---

## Verificação no Etherscan Sepolia

Após o deploy, verificar o código-fonte:
```bash
npx hardhat verify --network sepolia ENDEREÇO_DO_CONTRATO
```

Isso permite que qualquer pessoa leia o código do contrato diretamente no Etherscan,
aumentando a transparência e credibilidade do sistema (importante para o TCC).
