import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ConfidentialCreditScore contract...");

  // Get the contract factory
  const ConfidentialCreditScore = await ethers.getContractFactory(
    "ConfidentialCreditScore"
  );

  // Deploy the contract
  const contract = await ConfidentialCreditScore.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ConfidentialCreditScore deployed to:", address);

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("\nDeployment Summary:");
  console.log("Contract Address:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
