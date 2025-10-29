// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;


contract ConfidentialCreditScoreMock {
    
    // Borrower data structure (using regular uint64 for testing)
    struct BorrowerData {
        uint64 income;          
        uint64 repaymentScore;   
        uint64 liabilities;      
        uint64 creditScore;     
        bool hasSubmittedData;
        bool hasScore;
    }
    
 
    mapping(address => BorrowerData) private borrowers;
    
 
    event DataSubmitted(address indexed borrower);
    event CreditScoreComputed(address indexed borrower);
    
   
    function submitBorrowerData(
        uint64 income,
        uint64 repaymentScore,
        uint64 liabilities
    ) external {
        
        borrowers[msg.sender].income = income;
        borrowers[msg.sender].repaymentScore = repaymentScore;
        borrowers[msg.sender].liabilities = liabilities;
        borrowers[msg.sender].hasSubmittedData = true;
        
        emit DataSubmitted(msg.sender);
    }
    
    /// @notice Compute credit score on data
   
    function computeCreditScore() external {
        BorrowerData storage data = borrowers[msg.sender];
        require(data.hasSubmittedData, "No data submitted");
        
        // Calculate debt-to-income ratio (as percentage, multiplied by 100 for precision)
        uint256 debtToIncomeRatio;
        if (data.income > 0) {
            debtToIncomeRatio = (uint256(data.liabilities) * 10000) / uint256(data.income);
        } else {
            debtToIncomeRatio = 10000; // 100% if no income
        }
        
        // Base score from repayment history (0-100 -> 300-550 range)
        uint256 repaymentComponent = 300 + (uint256(data.repaymentScore) * 250 / 100);
        
        // Debt component: penalize high debt-to-income ratios
        // If DTI < 30% (3000): full 300 points
        // If DTI > 100% (10000): 0 points
        uint256 debtComponent;
        if (debtToIncomeRatio <= 3000) {
            debtComponent = 300;
        } else if (debtToIncomeRatio >= 10000) {
            debtComponent = 0;
        } else {
            // Linear decrease from 300 to 0 as DTI goes from 30% to 100%
            debtComponent = 300 - ((debtToIncomeRatio - 3000) * 300 / 7000);
        }
        
        // Calculate final score
        uint256 rawScore = repaymentComponent + debtComponent;
        
        // Ensure score is within bounds (300-850)
        uint64 score;
        if (rawScore > 850) {
            score = 850;
        } else if (rawScore < 300) {
            score = 300;
        } else {
            score = uint64(rawScore);
        }
        
        // Store the score
        data.creditScore = score;
        data.hasScore = true;
        
        emit CreditScoreComputed(msg.sender);
    }
    
    /// @notice Get credit score
    /// @return Credit score (300-850)
    function getCreditScore() external view returns (uint64) {
        require(borrowers[msg.sender].hasScore, "No score computed");
        return borrowers[msg.sender].creditScore;
    }
    
    /// @notice Check if borrower has submitted data
    function hasSubmittedData() external view returns (bool) {
        return borrowers[msg.sender].hasSubmittedData;
    }
    
    /// @notice Check if credit score has been computed
    function hasCreditScore() external view returns (bool) {
        return borrowers[msg.sender].hasScore;
    }
    
    /// @notice Get all borrower data (for testing/debugging)
    function getBorrowerData() external view returns (
        uint64 income,
        uint64 repaymentScore,
        uint64 liabilities,
        uint64 creditScore,
        bool hasData,
        bool hasScore
    ) {
        BorrowerData storage data = borrowers[msg.sender];
        return (
            data.income,
            data.repaymentScore,
            data.liabilities,
            data.creditScore,
            data.hasSubmittedData,
            data.hasScore
        );
    }
}