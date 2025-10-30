import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { Signer } from "ethers";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("LendingMarketplace (FHE)", function () {
  let borrower: Signer;
  let lender: Signer;
  let contract: any;

  before(async function () {
    [borrower, lender] = await ethers.getSigners();

    if (!fhevm.isMock) {
      console.warn("This test requires FHEVM mock environment");
      this.skip();
    }

    const factory = await ethers.getContractFactory("LendingMarketplace");
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  it("should allow borrower to submit encrypted data and compute encrypted credit score", async function () {
    const borrowerAddr = await borrower.getAddress();

    const encIncome = await fhevm
      .createEncryptedInput(contract.target, borrowerAddr)
      .add64(100_000)
      .encrypt();
    const encRepayment = await fhevm
      .createEncryptedInput(contract.target, borrowerAddr)
      .add64(80)
      .encrypt();
    const encLiabilities = await fhevm
      .createEncryptedInput(contract.target, borrowerAddr)
      .add64(25_000)
      .encrypt();

    await contract
      .connect(borrower)
      .submitBorrowerData(
        encIncome.handles[0],
        encIncome.inputProof,
        encRepayment.handles[0],
        encRepayment.inputProof,
        encLiabilities.handles[0],
        encLiabilities.inputProof
      );

    await contract.connect(borrower).computeCreditScore();

    const encryptedScore = await contract.connect(borrower).getCreditScore();
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedScore,
      contract.target,
      borrower
    );

    console.log("Decrypted credit score:", decryptedScore);
    expect(decryptedScore).to.be.within(300, 850);
  });

  it("should let borrower create a loan request", async function () {
    const borrowerAddr = await borrower.getAddress();

    const encAmount = await fhevm
      .createEncryptedInput(contract.target, borrowerAddr)
      .add64(50_000)
      .encrypt();
    const encDuration = await fhevm
      .createEncryptedInput(contract.target, borrowerAddr)
      .add64(12)
      .encrypt();

    const tx = await contract
      .connect(borrower)
      .createLoanRequest(
        encAmount.handles[0],
        encAmount.inputProof,
        encDuration.handles[0],
        encDuration.inputProof
      );

    await tx.wait();
    const loanId = await contract.nextLoanId();
    expect(loanId).to.equal(1n);
  });

  it("should let lender create a lender offer", async function () {
    const lenderAddr = await lender.getAddress();

    const encMinScore = await fhevm
      .createEncryptedInput(contract.target, lenderAddr)
      .add64(400)
      .encrypt();
    const encMaxAmount = await fhevm
      .createEncryptedInput(contract.target, lenderAddr)
      .add64(100_000)
      .encrypt();
    const encInterest = await fhevm
      .createEncryptedInput(contract.target, lenderAddr)
      .add64(500) // 5%
      .encrypt();

    const tx = await contract
      .connect(lender)
      .createLenderOffer(
        encMinScore.handles[0],
        encMinScore.inputProof,
        encMaxAmount.handles[0],
        encMaxAmount.inputProof,
        encInterest.handles[0],
        encInterest.inputProof,
        { value: ethers.parseEther("1") }
      );

    await tx.wait();
    const offerId = await contract.nextOfferId();
    expect(offerId).to.equal(1n);
  });

  it("should match and fund the loan successfully", async function () {
    // Mock FHE comparison succeeds in mock environment
    await contract.connect(lender).checkLoanMatch(0, 0);

    const beforeBalance = await ethers.provider.getBalance(
      await borrower.getAddress()
    );

    const tx = await contract.connect(lender).fundLoan(0, 0);
    await tx.wait();

    const afterBalance = await ethers.provider.getBalance(
      await borrower.getAddress()
    );

    expect(afterBalance).to.be.gt(beforeBalance);

    const [, , , isFunded, lenderAddr] = await contract.getLoanRequest(0);
    expect(isFunded).to.be.true;
    expect(lenderAddr).to.equal(await lender.getAddress());
  });
});
