import * as fs from "fs";
import * as path from "path";

/**
 * Copia a ABI + endereço do contrato DocumentRegistry para o backend NestJS,
 * para que o BlockchainService possa carregar sem depender de compile local.
 *
 * Fonte:  ../docchain-contracts/artifacts/deployment.json
 * Destino: ../docchain-api/src/blockchain/abi/DocumentRegistry.json
 */

const NETWORK = process.env.DEPLOYMENT_NETWORK || "sepolia";
const DEPLOYMENT_PATH = path.join(__dirname, "..", "deployments", `${NETWORK}.json`);
const BACKEND_ABI_DIR = path.join(
  __dirname,
  "..",
  "..",
  "docchain-api",
  "src",
  "blockchain",
  "abi"
);
const BACKEND_ABI_FILE = path.join(BACKEND_ABI_DIR, "DocumentRegistry.json");

function main() {
  if (!fs.existsSync(DEPLOYMENT_PATH)) {
    console.error(`❌ deployment.json not found at ${DEPLOYMENT_PATH}`);
    console.error("   Run scripts/deploy.ts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));

  if (!deployment.abi || !deployment.address) {
    console.error("❌ deployment.json is missing 'abi' or 'address' fields.");
    process.exit(1);
  }

  if (!fs.existsSync(BACKEND_ABI_DIR)) {
    console.log(`📁 Creating directory: ${BACKEND_ABI_DIR}`);
    fs.mkdirSync(BACKEND_ABI_DIR, { recursive: true });
  }

  const payload = {
    address: deployment.address,
    network: deployment.network,
    chainId: deployment.chainId,
    deployedAt: deployment.deployedAt,
    abi: deployment.abi,
  };

  fs.writeFileSync(BACKEND_ABI_FILE, JSON.stringify(payload, null, 2));

  console.log("✅ ABI exported to backend");
  console.log(`   Source:      deployments/${NETWORK}.json`);
  console.log(`   Destination: ${path.relative(process.cwd(), BACKEND_ABI_FILE)}`);
  console.log(`   Address:     ${deployment.address}`);
  console.log(`   Network:     ${deployment.network} (chainId ${deployment.chainId})`);
  console.log("\n🔧 Remember to set in docchain-api/.env:");
  console.log(`   CONTRACT_ADDRESS=${deployment.address}`);
}

main();
