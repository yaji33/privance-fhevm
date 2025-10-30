import { ethers } from "hardhat";

async function main() {
  console.log("Deploying LendingMarketplace contract...");

  // Get the contract factory
  const LendingMarketplace =
    await ethers.getContractFactory("LendingMarketplace");

  // Deploy the contract
  console.log("Deploying... (this may take a few minutes for FHE contracts)");
  const contract = await LendingMarketplace.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LendingMarketplace deployed to:", address);

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  // Get network info using the provider
  const network = await ethers.provider.getNetwork();

  console.log("\nDeployment Summary:");
  console.log("Contract Address:", address);
  console.log("Network Name:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");

  // Verify the contract has the expected functions
  console.log("\nContract Verification:");
  console.log("Next Loan ID:", (await contract.nextLoanId()).toString());
  console.log("Next Offer ID:", (await contract.nextOfferId()).toString());

  console.log("\n Deployment completed successfully!");
  console.log("Update your .env file with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
