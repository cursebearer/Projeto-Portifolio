import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`Deploying DocumentRegistry to network: ${network.name}`);

  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);

  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 ETH. Fund it via a Sepolia faucet before deploying."
    );
  }

  const Factory = await ethers.getContractFactory("DocumentRegistry");
  const contract = await Factory.deploy();

  console.log("Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("\n✅ DocumentRegistry deployed successfully");
  console.log("   Address:  ", address);
  console.log("   Network:  ", network.name);
  console.log("   Tx hash:  ", deployTx?.hash ?? "n/a");
  console.log("   Block:    ", deployTx?.blockNumber ?? "n/a");

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DocumentRegistry.sol",
    "DocumentRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Run "npx hardhat compile" first.`);
  }

  const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentInfo = {
    address,
    network: network.name,
    chainId: Number((await deployer.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    txHash: deployTx?.hash ?? null,
    blockNumber: deployTx?.blockNumber ?? null,
    abi: artifactJson.abi,
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n📄 Deployment info saved to: deployments/${network.name}.json`);

  console.log("\n──────────────── Next steps ────────────────");
  console.log(`1. Export ABI to backend:`);
  console.log(`     npx hardhat run scripts/exportAbi.ts`);
  console.log(`2. Set CONTRACT_ADDRESS in docchain-api/.env:`);
  console.log(`     CONTRACT_ADDRESS=${address}`);
  if (network.name === "sepolia") {
    console.log(`3. Verify on Etherscan:`);
    console.log(`     npx hardhat verify --network sepolia ${address}`);
    console.log(`4. Etherscan URL:`);
    console.log(`     https://sepolia.etherscan.io/address/${address}`);
  }
  console.log("────────────────────────────────────────────");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});
