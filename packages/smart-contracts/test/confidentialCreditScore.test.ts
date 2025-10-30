import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { Signer } from "ethers";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialCreditScore (FHE)", function () {
  let signer: Signer;
  let contract: any;

  before(async function () {
    [signer] = await ethers.getSigners();

    if (!fhevm.isMock) {
      console.warn("This test requires FHEVM mock environment");
      this.skip();
    }

    const factory = await ethers.getContractFactory("ConfidentialCreditScore");
    contract = await factory.deploy();
    await contract.waitForDeployment();

    // Register the contract for mock FHE handles
  });

  it("should submit encrypted borrower data and compute encrypted score", async () => {
    const income = 100_000;
    const repaymentScore = 80;
    const liabilities = 25_000;
    const signerAddress = await signer.getAddress();

    // Encrypt inputs using FHEVM plugin
    const encIncome = await fhevm
      .createEncryptedInput(contract.target, signerAddress)
      .add64(income)
      .encrypt();
    const encRepayment = await fhevm
      .createEncryptedInput(contract.target, signerAddress)
      .add64(repaymentScore)
      .encrypt();
    const encLiabilities = await fhevm
      .createEncryptedInput(contract.target, signerAddress)
      .add64(liabilities)
      .encrypt();

    await contract
      .connect(signer)
      .submitBorrowerData(
        encIncome.handles[0],
        encIncome.inputProof,
        encRepayment.handles[0],
        encRepayment.inputProof,
        encLiabilities.handles[0],
        encLiabilities.inputProof
      );

    await contract.connect(signer).computeCreditScore();

    const encryptedScore = await contract.getCreditScore();

    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedScore,
      contract.target,
      signer
    );

    console.log("Decrypted credit score:", decryptedScore);

    expect(decryptedScore).to.be.at.least(300);
    expect(decryptedScore).to.be.at.most(850);
  });
});
