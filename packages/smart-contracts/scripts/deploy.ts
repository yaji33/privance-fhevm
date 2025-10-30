import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Enhanced Lending Marketplace...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  console.log("\n📋 Phase 1: Deploy with Placeholder Addresses");
  console.log("=".repeat(50));

  const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000001";

  console.log("\n1. Deploying LendingMarketplace (with placeholders)...");
  const LendingMarketplace =
    await ethers.getContractFactory("LendingMarketplace");
  const marketplace = await LendingMarketplace.deploy(
    PLACEHOLDER_ADDRESS,
    PLACEHOLDER_ADDRESS
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("LendingMarketplace:", marketplaceAddress);

  console.log("\n2. Deploying CollateralManager...");
  const CollateralManager =
    await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(marketplaceAddress);
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("CollateralManager:", collateralManagerAddress);

  const cmMarketplace = await collateralManager.lendingMarketplace();
  console.log("   ↳ lendingMarketplace:", cmMarketplace);
  if (cmMarketplace.toLowerCase() !== marketplaceAddress.toLowerCase()) {
    throw new Error("CollateralManager has wrong marketplace address!");
  }

  console.log("\n3. Deploying RepaymentTracker...");
  const RepaymentTracker = await ethers.getContractFactory("RepaymentTracker");
  const repaymentTracker = await RepaymentTracker.deploy(
    marketplaceAddress,
    collateralManagerAddress
  );
  await repaymentTracker.waitForDeployment();
  const repaymentTrackerAddress = await repaymentTracker.getAddress();
  console.log("RepaymentTracker:", repaymentTrackerAddress);

  const rtMarketplace = await repaymentTracker.lendingMarketplace();
  console.log("   ↳ lendingMarketplace:", rtMarketplace);
  if (rtMarketplace.toLowerCase() !== marketplaceAddress.toLowerCase()) {
    throw new Error("RepaymentTracker has wrong marketplace address!");
  }

  console.log("\n📋 Phase 2: Update LendingMarketplace with Correct Addresses");
  console.log("=".repeat(50));

  console.log("\n4. Updating LendingMarketplace references...");

  try {
    if (typeof marketplace.updateCollateralManager === "function") {
      const tx1 = await marketplace.updateCollateralManager(
        collateralManagerAddress
      );
      await tx1.wait();
      console.log("Updated CollateralManager reference");
    } else {
      console.log("No updateCollateralManager function found");
      console.log(
        "   You may need to add setter functions to LendingMarketplace"
      );
    }

    if (typeof marketplace.updateRepaymentTracker === "function") {
      const tx2 = await marketplace.updateRepaymentTracker(
        repaymentTrackerAddress
      );
      await tx2.wait();
      console.log("Updated RepaymentTracker reference");
    } else {
      console.log("No updateRepaymentTracker function found");
      console.log(
        "   You may need to add setter functions to LendingMarketplace"
      );
    }
  } catch (error) {
    console.log("Could not update marketplace references");
    console.log(
      "   If your contract doesn't have setters, you'll need to redeploy"
    );
    console.log("   See the alternative deployment script below");
  }

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📝 Update your .env file with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${marketplaceAddress}`);
  console.log(`NEXT_PUBLIC_COLLATERAL_MANAGER=${collateralManagerAddress}`);
  console.log(`NEXT_PUBLIC_REPAYMENT_TRACKER=${repaymentTrackerAddress}`);

  console.log("\n📋 Contract Addresses:");
  console.log("LendingMarketplace: ", marketplaceAddress);
  console.log("CollateralManager:  ", collateralManagerAddress);
  console.log("RepaymentTracker:   ", repaymentTrackerAddress);

  console.log("\nVerification:");
  console.log("CollateralManager.lendingMarketplace:", cmMarketplace);
  console.log("RepaymentTracker.lendingMarketplace: ", rtMarketplace);
  console.log("Expected marketplace address:        ", marketplaceAddress);
  console.log(
    "Match:",
    cmMarketplace.toLowerCase() === marketplaceAddress.toLowerCase() &&
      rtMarketplace.toLowerCase() === marketplaceAddress.toLowerCase()
      ? "CORRECT"
      : "MISMATCH"
  );

  return {
    marketplace: marketplaceAddress,
    collateralManager: collateralManagerAddress,
    repaymentTracker: repaymentTrackerAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
