// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "./interfaces/IRepaymentTracker.sol";
import "./interfaces/ICollateralManager.sol";

/// @title Repayment Tracker for Lending Marketplace
contract RepaymentTracker is IRepaymentTracker {
    
    struct RepaymentAgreement {
        uint256 agreementId;
        uint256 loanId;
        uint256 offerId;
        address borrower;
        address lender;
        uint256 principal;
        uint256 interestRate; // in basis points (500 = 5%)
        uint256 duration; // in days
        uint256 collateralAmount;
        uint256 totalRepaymentAmount;
        uint256 amountRepaid;
        uint256 dueDate;
        uint256 creationTime;
        bool isActive;
        bool isRepaid;
        bool isDefaulted;
    }

    mapping(uint256 => RepaymentAgreement) public agreements;
    mapping(address => uint256[]) public borrowerAgreements;
    mapping(address => uint256[]) public lenderAgreements;
    
    uint256 public nextAgreementId;
    address public lendingMarketplace;
    ICollateralManager public collateralManager;

    event AgreementCreated(uint256 indexed agreementId, uint256 loanId, uint256 offerId);
    event PaymentMade(uint256 indexed agreementId, uint256 amount, uint256 remainingBalance);
    event AgreementRepaid(uint256 indexed agreementId);
    event LoanDefaulted(uint256 indexed agreementId);

    modifier onlyMarketplace() {
        require(msg.sender == lendingMarketplace, "Only lending marketplace can call");
        _;
    }

    modifier onlyBorrower(uint256 agreementId) {
        require(agreements[agreementId].borrower == msg.sender, "Only borrower can call");
        _;
    }

    constructor(address _lendingMarketplace, address _collateralManager) {
    lendingMarketplace = _lendingMarketplace; 
    collateralManager = ICollateralManager(_collateralManager);
}

    /// @notice Create a new repayment agreement (called by main contract)
    function createAgreement(
        uint256 loanId,
        uint256 offerId,
        address borrower,
        address lender,
        uint256 principal,
        uint256 interestRate,
        uint256 duration,
        uint256 collateralAmount
    ) external onlyMarketplace returns (uint256) {
        
        uint256 agreementId = nextAgreementId++;
        
        // Calculate total repayment amount
        uint256 interestAmount = (principal * interestRate * duration) / (10000 * 365); // Simple interest
        uint256 totalRepayment = principal + interestAmount;
        
        agreements[agreementId] = RepaymentAgreement({
            agreementId: agreementId,
            loanId: loanId,
            offerId: offerId,
            borrower: borrower,
            lender: lender,
            principal: principal,
            interestRate: interestRate,
            duration: duration,
            collateralAmount: collateralAmount,
            totalRepaymentAmount: totalRepayment,
            amountRepaid: 0,
            dueDate: block.timestamp + (duration * 1 days),
            creationTime: block.timestamp,
            isActive: true,
            isRepaid: false,
            isDefaulted: false
        });

        borrowerAgreements[borrower].push(agreementId);
        lenderAgreements[lender].push(agreementId);

        emit AgreementCreated(agreementId, loanId, offerId);
        return agreementId;
    }

    /// @notice Make a payment towards loan repayment
    function makePayment(uint256 agreementId) external payable onlyBorrower(agreementId) {
        RepaymentAgreement storage agreement = agreements[agreementId];
        
        require(agreement.isActive, "Agreement not active");
        require(!agreement.isRepaid, "Loan already repaid");
        require(!agreement.isDefaulted, "Loan is defaulted");
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        agreement.amountRepaid += msg.value;
        
        // Transfer payment to lender
        payable(agreement.lender).transfer(msg.value);
        
        // Check if loan is fully repaid
        if (agreement.amountRepaid >= agreement.totalRepaymentAmount) {
            agreement.isRepaid = true;
            agreement.isActive = false;
            
            // Release collateral
            collateralManager.releaseCollateral(agreement.loanId);
            
            emit AgreementRepaid(agreementId);
        }
        
        emit PaymentMade(agreementId, msg.value, agreement.totalRepaymentAmount - agreement.amountRepaid);
    }

    /// @notice Check for defaulted loans (can be called by anyone)
    function checkDefault(uint256 agreementId) external {
        RepaymentAgreement storage agreement = agreements[agreementId];
        
        if (agreement.isActive && 
            !agreement.isRepaid && 
            !agreement.isDefaulted && 
            block.timestamp > agreement.dueDate) {
            
            agreement.isDefaulted = true;
            agreement.isActive = false;
            
            // Liquidate collateral to lender
            collateralManager.liquidateCollateral(agreement.loanId, agreement.lender);
            
            emit LoanDefaulted(agreementId);
        }
    }

    /// @notice Get agreement details
    function getAgreementDetails(uint256 agreementId) external view returns (
        address borrower,
        address lender,
        uint256 principal,
        uint256 interestRate,
        uint256 totalDue,
        uint256 amountPaid,
        uint256 dueDate,
        bool isActive
    ) {
        RepaymentAgreement memory agreement = agreements[agreementId];
        return (
            agreement.borrower,
            agreement.lender,
            agreement.principal,
            agreement.interestRate,
            agreement.totalRepaymentAmount,
            agreement.amountRepaid,
            agreement.dueDate,
            agreement.isActive
        );
    }

    /// @notice Get borrower's active agreements
    function getBorrowerAgreements(address borrower) external view returns (uint256[] memory) {
        return borrowerAgreements[borrower];
    }

    /// @notice Get lender's active agreements
    function getLenderAgreements(address lender) external view returns (uint256[] memory) {
        return lenderAgreements[lender];
    }

    /// @notice Calculate monthly payment amount
    function calculateMonthlyPayment(uint256 agreementId) external view returns (uint256) {
        RepaymentAgreement memory agreement = agreements[agreementId];
        uint256 months = agreement.duration / 30; // Approximate months
        if (months == 0) months = 1;
        return agreement.totalRepaymentAmount / months;
    }

    /// @notice Get agreement status
    function getAgreementStatus(uint256 agreementId) external view returns (string memory) {
        RepaymentAgreement memory agreement = agreements[agreementId];
        
        if (agreement.isRepaid) return "REPAID";
        if (agreement.isDefaulted) return "DEFAULTED";
        if (block.timestamp > agreement.dueDate) return "OVERDUE";
        if (agreement.isActive) return "ACTIVE";
        return "INACTIVE";
    }

    /// @notice Get time until due date
    function getTimeUntilDue(uint256 agreementId) external view returns (uint256) {
        RepaymentAgreement memory agreement = agreements[agreementId];
        if (block.timestamp >= agreement.dueDate) return 0;
        return agreement.dueDate - block.timestamp;
    }
}