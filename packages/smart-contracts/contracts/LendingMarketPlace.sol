// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "./CollateralManager.sol";
import "./RepaymentTracker.sol";

/// @title Confidential Lending Marketplace (FHE-integrated)
/// @notice Privacy-preserving lending marketplace using Zama FHEVM
contract LendingMarketplace is SepoliaConfig {

    struct BorrowerData {
        euint64 income;
        euint64 repaymentScore;
        euint64 liabilities;
        euint64 creditScore;
        bool hasSubmittedData;
        bool hasScore;
    }

    struct LoanRequest {
        address borrower;
        euint64 requestedAmount;
        euint64 duration;
        uint256 timestamp;
        bool isActive;
        bool isFunded;
        address lender;
        uint256 plainRequestedAmount; 
        uint256 plainDuration;       
    }

    struct LenderOffer {
        address lender;
        euint64 minCreditScore;
        euint64 maxLoanAmount;
        euint64 interestRate;
        uint256 availableFunds;
        bool isActive;
        uint256 collateralPercentage;
         uint256 plainInterestRate;   
        uint256 plainMaxLoanAmount;  
    }

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    mapping(address => BorrowerData) private borrowers;
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(uint256 => LenderOffer) public lenderOffers;
    mapping(uint256 => mapping(uint256 => bool)) public loanOfferMatches;
    
    uint256 public nextLoanId;
    uint256 public nextOfferId;

    CollateralManager public collateralManager;
    RepaymentTracker public repaymentTracker;

    constructor(address _collateralManager, address _repaymentTracker) {
        owner = msg.sender; 
        collateralManager = CollateralManager(_collateralManager);
        repaymentTracker = RepaymentTracker(_repaymentTracker);
    }


    event DataSubmitted(address indexed borrower);
    event CreditScoreComputed(address indexed borrower);
    event LoanRequested(uint256 indexed loanId, address indexed borrower);
    event OfferCreated(uint256 indexed offerId, address indexed lender);
    event LoanMatched(uint256 indexed loanId, uint256 indexed offerId);
    event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower);

    /// @notice Submit borrower data (encrypted off-chain)
    function submitBorrowerData(
        externalEuint64 incomeExternal, bytes calldata incomeProof,
        externalEuint64 repaymentScoreExternal, bytes calldata repaymentProof,
        externalEuint64 liabilitiesExternal, bytes calldata liabilitiesProof
    ) external {
        euint64 income = FHE.fromExternal(incomeExternal, incomeProof);
        euint64 repaymentScore = FHE.fromExternal(repaymentScoreExternal, repaymentProof);
        euint64 liabilities = FHE.fromExternal(liabilitiesExternal, liabilitiesProof);

        FHE.allowThis(income);
        FHE.allowThis(repaymentScore);
        FHE.allowThis(liabilities);
        FHE.allow(income, msg.sender);
        FHE.allow(repaymentScore, msg.sender);
        FHE.allow(liabilities, msg.sender);

        borrowers[msg.sender].income = income;
        borrowers[msg.sender].repaymentScore = repaymentScore;
        borrowers[msg.sender].liabilities = liabilities;
        borrowers[msg.sender].hasSubmittedData = true;

        emit DataSubmitted(msg.sender);
    }

    /// @notice Compute repayment component: 300 + (repaymentScore * 2)
    function computeRepaymentComponent(euint64 repaymentScore) internal returns (euint64) {
        euint64 C300 = FHE.asEuint64(300);
        euint64 result = FHE.add(C300, FHE.mul(repaymentScore, FHE.asEuint64(2)));
        FHE.allowThis(result);
        return result;
    }

    /// @notice Compute debt component based on debt-to-income ratio
    function computeDebtComponent(euint64 income, euint64 liabilities) internal returns (euint64) {
        euint64 C0 = FHE.asEuint64(0);
        euint64 C200 = FHE.asEuint64(200);
        euint64 C350 = FHE.asEuint64(350);
        euint64 C30 = FHE.asEuint64(30);
        euint64 C50 = FHE.asEuint64(50);
        euint64 C100 = FHE.asEuint64(100);

        euint64 liabilitiesScaled = FHE.mul(liabilities, C100);
        FHE.allowThis(liabilitiesScaled);
        
        euint64 income30 = FHE.mul(income, C30);
        FHE.allowThis(income30);
        
        euint64 income50 = FHE.mul(income, C50);
        FHE.allowThis(income50);

        ebool dtiLe30 = FHE.le(liabilitiesScaled, income30);
        FHE.allowThis(dtiLe30);
        
        ebool dtiGe50 = FHE.ge(liabilitiesScaled, income50);
        FHE.allowThis(dtiGe50);

        euint64 midOrHigh = FHE.select(dtiGe50, C0, C200);
        FHE.allowThis(midOrHigh);
        
        euint64 result = FHE.select(dtiLe30, C350, midOrHigh);
        FHE.allowThis(result);
        
        return result;
    }

    /// @notice Clamp score between 300 and 850
    function clampScore(euint64 score) internal returns (euint64) {
        euint64 C300 = FHE.asEuint64(300);
        euint64 C850 = FHE.asEuint64(850);

        ebool below300 = FHE.lt(score, C300);
        FHE.allowThis(below300);
        
        ebool above850 = FHE.gt(score, C850);
        FHE.allowThis(above850);

        euint64 clampedLow = FHE.select(below300, C300, score);
        FHE.allowThis(clampedLow);
        
        euint64 result = FHE.select(above850, C850, clampedLow);
        FHE.allowThis(result);
        
        return result;
    }

    /// @notice Compute encrypted credit score
    function computeCreditScore() external {
        BorrowerData storage data = borrowers[msg.sender];
        require(data.hasSubmittedData, "No data submitted");

        // Re-grant permissions for stored encrypted values
        FHE.allowThis(data.income);
        FHE.allowThis(data.repaymentScore);
        FHE.allowThis(data.liabilities);

        euint64 repaymentComponent = computeRepaymentComponent(data.repaymentScore);
        euint64 debtComponent = computeDebtComponent(data.income, data.liabilities);
        
        euint64 rawScore = FHE.add(repaymentComponent, debtComponent);
        FHE.allowThis(rawScore);
        
        euint64 finalScore = clampScore(rawScore);
        
        // CRITICAL: Grant comprehensive ACL permissions for the credit score
        FHE.allowThis(finalScore);           // Contract can use it
        FHE.allow(finalScore, msg.sender);   // User can decrypt it
        
        // Store the score
        data.creditScore = finalScore;
        data.hasScore = true;

        emit CreditScoreComputed(msg.sender);
    }

    /// @notice Create a loan request (borrower)
    function createLoanRequest(
        externalEuint64 amountExternal, bytes calldata amountProof,
        externalEuint64 durationExternal, bytes calldata durationProof,
        uint256 plainRequestedAmount,  
        uint256 plainDuration      
    ) external returns (uint256) {
        BorrowerData storage borrower = borrowers[msg.sender];
        require(borrower.hasScore, "Must have credit score first");
        
        // Import encrypted values from client
        euint64 amount = FHE.fromExternal(amountExternal, amountProof);
        euint64 duration = FHE.fromExternal(durationExternal, durationProof);
        
        // Grant ACL permissions for new encrypted values
        FHE.allowThis(amount);
        FHE.allowThis(duration);
        FHE.allow(amount, msg.sender);
        FHE.allow(duration, msg.sender);
        
        // Ensure credit score permissions are still valid
        FHE.allowThis(borrower.creditScore);

        uint256 loanId = nextLoanId++;
        
        loanRequests[loanId] = LoanRequest({
            borrower: msg.sender,
            requestedAmount: amount,
            duration: duration,
            timestamp: block.timestamp,
            isActive: true,
            isFunded: false,
            lender: address(0),
            plainRequestedAmount: plainRequestedAmount, 
            plainDuration: plainDuration  
        });

        emit LoanRequested(loanId, msg.sender);
        return loanId;
    }

    /// @notice Create a lender offer
    function createLenderOffer(
        externalEuint64 minScoreExternal, bytes calldata minScoreProof,
        externalEuint64 maxAmountExternal, bytes calldata maxAmountProof,
        externalEuint64 interestRateExternal, bytes calldata interestProof,
        uint256 collateralPercentage ,
        uint256 plainInterestRate,    
        uint256 plainMaxLoanAmount    
    ) external payable returns (uint256) {
        require(msg.value > 0, "Must deposit funds");
        require(collateralPercentage <= 10000, "Collateral percentage too high");


        euint64 minScore = FHE.fromExternal(minScoreExternal, minScoreProof);
        euint64 maxAmount = FHE.fromExternal(maxAmountExternal, maxAmountProof);
        euint64 interestRate = FHE.fromExternal(interestRateExternal, interestProof);
        
        FHE.allowThis(minScore);
        FHE.allowThis(maxAmount);
        FHE.allowThis(interestRate);
        FHE.allow(minScore, msg.sender);
        FHE.allow(maxAmount, msg.sender);
        FHE.allow(interestRate, msg.sender);

        uint256 offerId = nextOfferId++;
        
        lenderOffers[offerId] = LenderOffer({
            lender: msg.sender,
            minCreditScore: minScore,
            maxLoanAmount: maxAmount,
            interestRate: interestRate,
            availableFunds: msg.value,
            isActive: true,
            collateralPercentage: collateralPercentage,
            plainInterestRate: plainInterestRate,       
            plainMaxLoanAmount: plainMaxLoanAmount    
        });

        emit OfferCreated(offerId, msg.sender);
        return offerId;
    }

    /// @notice Check if loan matches offer criteria (encrypted)
    function checkLoanMatch(uint256 loanId, uint256 offerId) external returns (bool) {
        LoanRequest storage loan = loanRequests[loanId];
        LenderOffer storage offer = lenderOffers[offerId];
        BorrowerData storage borrower = borrowers[loan.borrower];
        
        require(loan.isActive && !loan.isFunded, "Loan not available");
        require(offer.isActive, "Offer not active");
        require(borrower.hasScore, "Borrower has no score");

        // Re-grant ACL permissions for all encrypted values
        FHE.allowThis(borrower.creditScore);
        FHE.allowThis(loan.requestedAmount);
        FHE.allowThis(loan.duration);
        FHE.allowThis(offer.minCreditScore);
        FHE.allowThis(offer.maxLoanAmount);
        FHE.allowThis(offer.interestRate);

        // Encrypted comparisons
        ebool scoreMatches = FHE.ge(borrower.creditScore, offer.minCreditScore);
        FHE.allowThis(scoreMatches);
        
        ebool amountMatches = FHE.le(loan.requestedAmount, offer.maxLoanAmount);
        FHE.allowThis(amountMatches);
        
        ebool matches = FHE.and(scoreMatches, amountMatches);
        FHE.allowThis(matches);
        
        loanOfferMatches[loanId][offerId] = true;
        
        emit LoanMatched(loanId, offerId);
        return true;
    }

    /// @notice Fund a loan (lender accepts)
    function fundLoan(uint256 loanId, uint256 offerId) external {
        LoanRequest storage loan = loanRequests[loanId];
        LenderOffer storage offer = lenderOffers[offerId];
        
        require(msg.sender == offer.lender, "Not the lender");
        require(loan.isActive && !loan.isFunded, "Loan not available");
        require(loanOfferMatches[loanId][offerId], "Loan not matched");

        uint256 collateralRequired = (offer.availableFunds * offer.collateralPercentage) / 10000;

        require(
            collateralManager.getUserCollateral(loan.borrower) >= collateralRequired,
            "Insufficient collateral"
        );
        
        collateralManager.lockCollateral(loan.borrower, collateralRequired, loanId);

        uint256 agreementId = repaymentTracker.createAgreement(
            loanId,
            offerId,
            loan.borrower,
            msg.sender,
            loan.plainRequestedAmount,  
            offer.plainInterestRate,    
            loan.plainDuration,         
            collateralRequired
        );

        // Finally we can transfer to the borrower

        loan.isFunded = true;
        loan.lender = msg.sender;
        loan.isActive = false;
        
        payable(loan.borrower).transfer(offer.availableFunds);
        offer.isActive = false;
        
        emit LoanFunded(loanId, msg.sender, loan.borrower);
    }

    /// @notice Get credit score (encrypted)
    function getCreditScore() external view returns (euint64) {
        require(borrowers[msg.sender].hasScore, "No score computed");
        return borrowers[msg.sender].creditScore;
    }

    /// @notice Check if user has submitted data
    function hasSubmittedData() external view returns (bool) {
        return borrowers[msg.sender].hasSubmittedData;
    }

    /// @notice Check if user has credit score
    function hasCreditScore() external view returns (bool) {
        return borrowers[msg.sender].hasScore;
    }

    /// @notice Get loan details
    function getLoanRequest(uint256 loanId) external view returns (
        address borrower,
        uint256 timestamp,
        bool isActive,
        bool isFunded,
        address lender
    ) {
        LoanRequest storage loan = loanRequests[loanId];
        return (
            loan.borrower,
            loan.timestamp,
            loan.isActive,
            loan.isFunded,
            loan.lender
        );
    }

    /// @notice Get offer details
    function getLenderOffer(uint256 offerId) external view returns (
        address lender,
        uint256 availableFunds,
        bool isActive
    ) {
        LenderOffer storage offer = lenderOffers[offerId];
        return (
            offer.lender,
            offer.availableFunds,
            offer.isActive
        );
    }
     /// @notice Get public metadata for lender's own offer (non-encrypted)
    function getLenderOfferMetadata(uint256 offerId) external view returns (
        address lender,
        uint256 plainInterestRate,
        uint256 plainMaxLoanAmount,
        uint256 availableFunds,
        bool isActive,
        uint256 collateralPercentage
    ) {
        LenderOffer storage offer = lenderOffers[offerId];
        require(msg.sender == offer.lender, "Not your offer");

        return (
            offer.lender,
            offer.plainInterestRate,
            offer.plainMaxLoanAmount,
            offer.availableFunds,
            offer.isActive,
            offer.collateralPercentage
        );
    }
    /// @notice Update CollateralManager address (owner only)
    function updateCollateralManager(address _collateralManager) external onlyOwner {
        collateralManager = CollateralManager(_collateralManager);
    }

    /// @notice Update RepaymentTracker address (owner only)
    function updateRepaymentTracker(address _repaymentTracker) external onlyOwner {
        repaymentTracker = RepaymentTracker(_repaymentTracker);
    }
}