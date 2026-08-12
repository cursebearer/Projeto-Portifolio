import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { DocumentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocumentRegistry", () => {
  let contract: DocumentRegistry;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("documento-de-teste.pdf"));
  const sampleStorageRef = "/uploads/abc123.enc";

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocumentRegistry");
    contract = (await Factory.deploy()) as unknown as DocumentRegistry;
  });

  describe("deployment", () => {
    it("deve definir owner como o deployer", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("deve iniciar totalDocuments em zero", async () => {
      expect(await contract.totalDocuments()).to.equal(0n);
    });
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

      const secondHash = ethers.keccak256(ethers.toUtf8Bytes("outro.pdf"));
      await contract.registerDocument(secondHash, "/uploads/xyz.enc");
      expect(await contract.totalDocuments()).to.equal(2n);
    });

    it("deve reverter com DocumentAlreadyRegistered ao registrar hash duplicado", async () => {
      await contract.registerDocument(sampleHash, sampleStorageRef);
      await expect(
        contract.registerDocument(sampleHash, sampleStorageRef)
      )
        .to.be.revertedWithCustomError(contract, "DocumentAlreadyRegistered")
        .withArgs(sampleHash);
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

    it("deve registrar corretamente quando chamado por endereço distinto do owner", async () => {
      await contract.connect(addr1).registerDocument(sampleHash, sampleStorageRef);
      const record = await contract.verifyDocument(sampleHash);
      expect(record.registeredBy).to.equal(addr1.address);
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
      expect(record.timestamp).to.be.greaterThan(0n);
    });

    it("deve retornar exists=false para hash não registrado", async () => {
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("inexistente"));
      const record = await contract.verifyDocument(unknownHash);
      expect(record.exists).to.be.false;
      expect(record.documentHash).to.equal(ethers.ZeroHash);
      expect(record.storageRef).to.equal("");
      expect(record.registeredBy).to.equal(ethers.ZeroAddress);
      expect(record.timestamp).to.equal(0n);
    });
  });

  describe("isRegistered", () => {
    it("deve retornar false antes do registro", async () => {
      expect(await contract.isRegistered(sampleHash)).to.be.false;
    });

    it("deve retornar true após o registro", async () => {
      await contract.registerDocument(sampleHash, sampleStorageRef);
      expect(await contract.isRegistered(sampleHash)).to.be.true;
    });
  });
});
