// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Confidential Credit Score (FHE-integrated)
/// @notice Fully homomorphic computation of borrower credit score using Zama FHEVM
contract ConfidentialCreditScore is SepoliaConfig {

    struct BorrowerData {
        euint64 income;
        euint64 repaymentScore;
        euint64 liabilities;
        euint64 creditScore;
        bool hasSubmittedData;
        bool hasScore;
    }

    mapping(address => BorrowerData) private borrowers;

    event DataSubmitted(address indexed borrower);
    event CreditScoreComputed(address indexed borrower);

    /// @notice Submit borrower data (encrypted off-chain)
    function submitBorrowerData(
        externalEuint64 incomeExternal, bytes calldata incomeProof,
        externalEuint64 repaymentScoreExternal, bytes calldata repaymentProof,
        externalEuint64 liabilitiesExternal, bytes calldata liabilitiesProof
    ) external {
        euint64 income = FHE.fromExternal(incomeExternal, incomeProof);
        euint64 repaymentScore = FHE.fromExternal(repaymentScoreExternal, repaymentProof);
        euint64 liabilities = FHE.fromExternal(liabilitiesExternal, liabilitiesProof);

        // Allow this contract to operate on these handles
        FHE.allowThis(income);
        FHE.allowThis(repaymentScore);
        FHE.allowThis(liabilities);

        borrowers[msg.sender].income = income;
        borrowers[msg.sender].repaymentScore = repaymentScore;
        borrowers[msg.sender].liabilities = liabilities;
        borrowers[msg.sender].hasSubmittedData = true;

        emit DataSubmitted(msg.sender);
    }

    /// @notice Compute repayment component: 300 + (repaymentScore * 2)
    /// Max: 500 points (when repaymentScore = 100)
    function computeRepaymentComponent(euint64 repaymentScore) internal returns (euint64) {
        euint64 C300 = FHE.asEuint64(300);
        return FHE.add(C300, FHE.mul(repaymentScore, FHE.asEuint64(2)));
    }

    /// @notice Compute debt component based on debt-to-income ratio
    /// We compare liabilities * thresholds against income to avoid division
    /// Logic:
    /// - If liabilities * 100 <= income * 30: DTI <= 30% → 350 points
    /// - If liabilities * 100 >= income * 50: DTI >= 50% → 0 points  
    /// - Else: 30% < DTI < 50% → 200 points
    function computeDebtComponent(euint64 income, euint64 liabilities) internal returns (euint64) {
        euint64 C0 = FHE.asEuint64(0);
        euint64 C200 = FHE.asEuint64(200);
        euint64 C350 = FHE.asEuint64(350);
        euint64 C30 = FHE.asEuint64(30);
        euint64 C50 = FHE.asEuint64(50);
        euint64 C100 = FHE.asEuint64(100);

        // Calculate liabilities * 100 (for percentage comparison)
        euint64 liabilitiesScaled = FHE.mul(liabilities, C100);
        
        // Calculate income * 30 (30% threshold)
        euint64 income30 = FHE.mul(income, C30);
        
        // Calculate income * 50 (50% threshold)
        euint64 income50 = FHE.mul(income, C50);

        // Check if DTI <= 30%: liabilities * 100 <= income * 30
        ebool dtiLe30 = FHE.le(liabilitiesScaled, income30);
        
        // Check if DTI >= 50%: liabilities * 100 >= income * 50
        ebool dtiGe50 = FHE.ge(liabilitiesScaled, income50);

        // Apply scoring:
        // If DTI >= 50%: 0 points
        // Else if DTI <= 30%: 350 points
        // Else (between 30-50%): 200 points
        euint64 midOrHigh = FHE.select(dtiGe50, C0, C200);
        return FHE.select(dtiLe30, C350, midOrHigh);
    }

    /// @notice Clamp score between 300 and 850
    function clampScore(euint64 score) internal returns (euint64) {
        euint64 C300 = FHE.asEuint64(300);
        euint64 C850 = FHE.asEuint64(850);

        ebool below300 = FHE.lt(score, C300);
        ebool above850 = FHE.gt(score, C850);

        euint64 clampedLow = FHE.select(below300, C300, score);
        euint64 finalScore = FHE.select(above850, C850, clampedLow);

        return finalScore;
    }

    /// @notice Compute encrypted credit score homomorphically
    function computeCreditScore() external {
        BorrowerData storage data = borrowers[msg.sender];
        require(data.hasSubmittedData, "No data submitted");

        // Compute components
        euint64 repaymentComponent = computeRepaymentComponent(data.repaymentScore);
        euint64 debtComponent = computeDebtComponent(data.income, data.liabilities);

        // Sum components
        euint64 rawScore = FHE.add(repaymentComponent, debtComponent);

        // Clamp to valid range (300-850)
        euint64 finalScore = clampScore(rawScore);

        data.creditScore = finalScore;
        data.hasScore = true;

        FHE.allowThis(finalScore);
        FHE.allow(finalScore, msg.sender);

        emit CreditScoreComputed(msg.sender);
    }

    /// @notice Get the encrypted credit score
    function getCreditScore() external view returns (euint64) {
        require(borrowers[msg.sender].hasScore, "No score computed");
        return borrowers[msg.sender].creditScore;
    }

    function hasSubmittedData() external view returns (bool) {
        return borrowers[msg.sender].hasSubmittedData;
    }

    function hasCreditScore() external view returns (bool) {
        return borrowers[msg.sender].hasScore;
    }
}