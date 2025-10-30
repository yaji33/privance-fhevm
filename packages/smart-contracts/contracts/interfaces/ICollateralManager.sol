// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

interface ICollateralManager {
    function depositCollateral() external payable;
    function withdrawCollateral(uint256 amount) external;
    function lockCollateral(address borrower, uint256 amount, uint256 loanId) external;
    function releaseCollateral(uint256 loanId) external;
    function liquidateCollateral(uint256 loanId, address liquidator) external;
    function getUserCollateral(address user) external view returns (uint256);
    function getAvailableCollateral(address user) external view returns (uint256);
    function getTotalLockedCollateral(address user) external view returns (uint256);
}