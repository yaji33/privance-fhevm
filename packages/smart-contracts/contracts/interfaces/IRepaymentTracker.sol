// SPDX-License-Identifier: BSD-3-Clause-Clear  
pragma solidity ^0.8.24;

interface IRepaymentTracker {
    function createAgreement(
        uint256 loanId,
        uint256 offerId,
        address borrower,
        address lender,
        uint256 principal,
        uint256 interestRate,
        uint256 duration,
        uint256 collateralAmount
    ) external returns (uint256);
    
    function makePayment(uint256 agreementId) external payable;
    function checkDefault(uint256 agreementId) external;
    
    function getAgreementDetails(uint256 agreementId) external view returns (
        address borrower,
        address lender,
        uint256 principal,
        uint256 interestRate,
        uint256 totalDue,
        uint256 amountPaid,
        uint256 dueDate,
        bool isActive
    );
    
    function getBorrowerAgreements(address borrower) external view returns (uint256[] memory);
    function getLenderAgreements(address lender) external view returns (uint256[] memory);
    function calculateMonthlyPayment(uint256 agreementId) external view returns (uint256);
    function getAgreementStatus(uint256 agreementId) external view returns (string memory);
    function getTimeUntilDue(uint256 agreementId) external view returns (uint256);
}