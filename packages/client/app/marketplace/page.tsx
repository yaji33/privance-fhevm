"use client";

import React, { useCallback, useEffect, useState } from "react";
import WalletAuthGuard from "../_components/WalletGuard";
import { checkLoanMatch, fundLoan, getContract, getLenderOffer, getLoanRequest } from "../lib/contract";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface LoanRequest {
  loanId: number;
  borrower: string;
  timestamp: number;
  isActive: boolean;
  isFunded: boolean;
  lender: string;
  plainRequestedAmount: string;
  plainDuration: string;
}

interface LenderOffer {
  offerId: number;
  lender: string;
  availableFunds: string;
  isActive: boolean;
  plainMaxLoanAmount: string;
  plainInterestRate: string;
  collateralPercentage: string;
}

interface MatchedPair {
  loanId: number;
  offerId: number;
  loan: LoanRequest;
  offer: LenderOffer;
}

interface SelectedMatches {
  [loanId: number]: number;
}

export default function Marketplace() {
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [lenderOffers, setLenderOffers] = useState<LenderOffer[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<SelectedMatches>({});
  const { address } = useAccount();

  // Validation helper
  const validateLoanData = useCallback((loan: any, loanId: number): LoanRequest | null => {
    try {
      if (!loan || !ethers.isAddress(loan.borrower)) {
        console.warn(`Invalid loan data for ID ${loanId}:`, loan);
        return null;
      }

      return {
        loanId,
        borrower: loan.borrower,
        timestamp: Number(loan.timestamp),
        isActive: Boolean(loan.isActive),
        isFunded: Boolean(loan.isFunded),
        lender: loan.lender || ethers.ZeroAddress,
        plainRequestedAmount: loan.plainRequestedAmount?.toString() || "0",
        plainDuration: loan.plainDuration?.toString() || "0",
      };
    } catch (err) {
      console.error(`Error validating loan ${loanId}:`, err);
      return null;
    }
  }, []);

  const validateOfferData = useCallback((offer: any, offerId: number): LenderOffer | null => {
    try {
      if (!offer || !ethers.isAddress(offer.lender)) {
        console.warn(`Invalid offer data for ID ${offerId}:`, offer);
        return null;
      }

      return {
        offerId,
        lender: offer.lender,
        availableFunds: ethers.formatEther(offer.availableFunds || 0),
        isActive: Boolean(offer.isActive),
        plainMaxLoanAmount: offer.plainMaxLoanAmount?.toString() || "0",
        plainInterestRate: offer.plainInterestRate?.toString() || "0",
        collateralPercentage: offer.collateralPercentage?.toString() || "0",
      };
    } catch (err) {
      console.error(`Error validating offer ${offerId}:`, err);
      return null;
    }
  }, []);

  // Load matched pairs from contract
  const loadMatchedPairs = useCallback(async (loans: LoanRequest[], offers: LenderOffer[], contract: any) => {
    const matched: MatchedPair[] = [];

    for (const loan of loans) {
      if (loan.isActive && !loan.isFunded) {
        for (const offer of offers) {
          if (offer.isActive) {
            try {
              const isMatched = await contract.loanOfferMatches(loan.loanId, offer.offerId);

              if (isMatched) {
                matched.push({
                  loanId: loan.loanId,
                  offerId: offer.offerId,
                  loan,
                  offer,
                });
              }
            } catch {
              // Silently skip if query fails
              console.warn(`Failed to check match for loan ${loan.loanId} and offer ${offer.offerId}`);
            }
          }
        }
      }
    }

    console.log("Matched pairs:", matched);
    setMatchedPairs(matched);
  }, []);

  // Load marketplace data with comprehensive error handling
  const loadMarketplaceData = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();

      // Verify contract is deployed
      const code = await contract.runner?.provider?.getCode(contract.target);
      if (!code || code === "0x") {
        throw new Error("Contract not deployed at the specified address");
      }

      console.log("Loading marketplace data...");

      // Fetch total counts with error handling
      const nextLoanId = await contract.nextLoanId().catch((err: Error) => {
        console.error("Failed to fetch nextLoanId:", err);
        throw new Error("Unable to fetch loan count from contract");
      });

      const nextOfferId = await contract.nextOfferId().catch((err: Error) => {
        console.error("Failed to fetch nextOfferId:", err);
        throw new Error("Unable to fetch offer count from contract");
      });

      console.log(`Found ${nextLoanId} loan requests, ${nextOfferId} offers`);

      // Load all loan requests with validation
      const loans: LoanRequest[] = [];
      for (let i = 0; i < nextLoanId; i++) {
        try {
          const loanData = await getLoanRequest(i);
          const fullLoan = await contract.loanRequests(i);

          if (loanData && loanData.borrower !== ethers.ZeroAddress) {
            const validatedLoan = validateLoanData(
              {
                borrower: loanData.borrower,
                timestamp: loanData.timestamp,
                isActive: loanData.isActive,
                isFunded: loanData.isFunded,
                lender: loanData.lender,
                plainRequestedAmount: fullLoan.plainRequestedAmount,
                plainDuration: fullLoan.plainDuration,
              },
              i,
            );

            if (validatedLoan) {
              loans.push(validatedLoan);
            }
          }
        } catch (error) {
          console.warn(`Loan ${i} not found or error:`, error);
        }
      }

      // Load all lender offers with validation
      const offers: LenderOffer[] = [];
      for (let i = 0; i < nextOfferId; i++) {
        try {
          const offerData = await getLenderOffer(i);
          const fullOffer = await contract.lenderOffers(i);

          if (offerData && offerData.lender !== ethers.ZeroAddress) {
            const validatedOffer = validateOfferData(
              {
                lender: offerData.lender,
                availableFunds: offerData.availableFunds,
                isActive: offerData.isActive,
                plainMaxLoanAmount: fullOffer.plainMaxLoanAmount,
                plainInterestRate: fullOffer.plainInterestRate,
                collateralPercentage: fullOffer.collateralPercentage,
              },
              i,
            );

            if (validatedOffer) {
              offers.push(validatedOffer);
            }
          }
        } catch (error) {
          console.warn(`Offer ${i} not found or error:`, error);
        }
      }

      console.log("Loaded loans:", loans);
      console.log("Loaded offers:", offers);

      setLoanRequests(loans);
      setLenderOffers(offers);

      // Load actual matched pairs from contract
      await loadMatchedPairs(loans, offers, contract);
    } catch (err: any) {
      console.error("Error loading marketplace:", err);

      let errorMessage = "Failed to load marketplace data";

      if (err.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "Request cancelled by user";
      } else if (err.message?.includes("Contract not deployed")) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, validateLoanData, validateOfferData, loadMatchedPairs]);

  useEffect(() => {
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  // Handle match with authorization and confirmation
  const handleMatch = async (loanId: number, offerId: number) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    // Find the loan and offer
    const loan = loanRequests.find(l => l.loanId === loanId);
    const offer = lenderOffers.find(o => o.offerId === offerId);

    if (!loan || !offer) {
      alert(" Loan or offer not found");
      return;
    }

    // Authorization check - only borrower or lender can initiate match
    const isBorrower = address.toLowerCase() === loan.borrower.toLowerCase();
    const isLender = address.toLowerCase() === offer.lender.toLowerCase();

    if (!isBorrower && !isLender) {
      alert(" Only the borrower or lender can check this match");
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to check match between:\n\n` +
        `Loan #${loanId}: ${formatAmount(loan.plainRequestedAmount)} ETH for ${loan.plainDuration} days\n` +
        `Offer #${offerId}: Up to ${formatAmount(offer.plainMaxLoanAmount)} ETH at ${Number(offer.plainInterestRate) / 100}% interest\n\n` +
        `This will incur gas fees.`,
    );

    if (!confirmed) {
      return;
    }

    setMatching(true);
    setError(null);

    try {
      console.log(`Checking match for loan ${loanId} with offer ${offerId}...`);

      const tx = await checkLoanMatch(loanId, offerId);
      const receipt = await tx.wait();

      // Verify transaction success
      if (receipt.status === 0) {
        throw new Error("Transaction reverted");
      }

      console.log("Match checked in block:", receipt.blockNumber);
      alert(" Match check completed! Encrypted criteria evaluated on-chain.");

      // Reload marketplace to show new match
      await loadMarketplaceData();

      // Clear selection
      setSelectedMatches(prev => {
        const updated = { ...prev };
        delete updated[loanId];
        return updated;
      });
    } catch (err: any) {
      console.error("Error matching:", err);

      let errorMessage = "Failed to check match";

      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (err.message?.includes("Loan not available")) {
        errorMessage = "This loan is no longer available";
      } else if (err.message?.includes("Offer not active")) {
        errorMessage = "This offer is no longer active";
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(` ${errorMessage}`);
    } finally {
      setMatching(false);
    }
  };

  // Handle fund loan with enhanced validation
  const handleFundLoan = async (loanId: number, offerId: number, lenderAddress: string) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    // Check if current user is the lender
    if (address.toLowerCase() !== lenderAddress.toLowerCase()) {
      alert(" Only the lender can fund this loan");
      return;
    }

    // Find the match
    const match = matchedPairs.find(m => m.loanId === loanId && m.offerId === offerId);
    if (!match) {
      alert(" Match not found");
      return;
    }

    // Confirmation dialog with details
    const totalAmount = formatAmount(match.loan.plainRequestedAmount);
    const interest = Number(match.offer.plainInterestRate) / 100;
    const duration = match.loan.plainDuration;
    const collateral = Number(match.offer.collateralPercentage) / 100;

    const confirmed = window.confirm(
      `Confirm Loan Funding:\n\n` +
        `Amount: ${totalAmount} ETH\n` +
        `Interest Rate: ${interest}%\n` +
        `Duration: ${duration} days\n` +
        `Collateral Required: ${collateral}%\n` +
        `Borrower: ${formatAddress(match.loan.borrower)}\n\n` +
        `This action will transfer funds to the borrower and cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setFunding(true);
    setError(null);
    let txSucceeded = false;

    try {
      console.log(`Funding loan ${loanId} with offer ${offerId}...`);

      const tx = await fundLoan(loanId, offerId);
      const receipt = await tx.wait();

      // Verify transaction success
      if (receipt.status === 0) {
        throw new Error("Transaction reverted");
      }

      txSucceeded = true;
      console.log("Loan funded in block:", receipt.blockNumber);
      alert(" Loan funded successfully! Funds transferred to borrower.");

      // Reload marketplace
      await loadMarketplaceData();
    } catch (err: any) {
      console.error("Error funding loan:", err);

      let errorMessage = "Failed to fund loan";

      if (txSucceeded) {
        errorMessage = "Loan funded but failed to refresh data. Please reload the page.";
      } else if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds";
      } else if (err.message?.includes("Insufficient collateral")) {
        errorMessage = "Borrower has insufficient collateral";
      } else if (err.message?.includes("Loan not matched")) {
        errorMessage = "This loan is not matched with your offer";
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(` ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setFunding(false);
    }
  };

  // Filter active items
  const activeLoans = loanRequests.filter(loan => loan.isActive && !loan.isFunded);
  const activeOffers = lenderOffers.filter(offer => offer.isActive);

  // Format helpers with validation
  const formatAddress = (addr: string) => {
    if (!addr || !ethers.isAddress(addr)) {
      return "Invalid Address";
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatAmount = (wei: string) => {
    try {
      const num = Number(wei);
      if (isNaN(num) || num < 0) {
        console.warn(`Invalid amount: ${wei}`);
        return "Invalid";
      }
      return (num / 1e18).toFixed(4);
    } catch (err) {
      console.error(`Error formatting amount: ${wei}`, err);
      return "Error";
    }
  };

  return (
    <WalletAuthGuard
      title="Lending Marketplace"
      description="Browse, match, and fund confidential loans"
      requireConnection={true}
    >
      <div className="w-full min-h-screen flex justify-center items-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="bg-slate-800/50 border shadow-xl border-white/10  w-full mt-16 sm:mt-20 md:mt-24 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-red-200">Error</p>
                    <p className="text-[10px] sm:text-xs text-red-300/80 mt-0.5 sm:mt-1 break-words">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300 transition flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-900/30 border border-blue-500/30  p-2.5 sm:p-3 md:p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-indigo-200">Privacy-Preserving Matching</p>
                  <p className="text-[10px] sm:text-xs text-indigo-300/80 mt-0.5 sm:mt-1">
                    Credit scores, income, and liabilities remain encrypted using FHEVM. Matching happens through
                    encrypted comparisons on-chain.
                  </p>
                </div>
              </div>
            </div>

            {matchedPairs.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-3 sm:p-4 md:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 md:mb-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">
                    Matched Loans (Ready for Funding)
                  </h3>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-600/20 border border-green-500/30  text-green-400 text-[10px] sm:text-xs font-medium w-fit">
                    {matchedPairs.length} Ready
                  </span>
                </div>

                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                  {matchedPairs.map(match => (
                    <div
                      key={`${match.loanId}-${match.offerId}`}
                      className="bg-slate-900/50 border border-green-600/30  p-2.5 sm:p-3 md:p-4 hover:border-green-500/50 transition"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-300">
                          Loan #{match.loanId} + Offer #{match.offerId}
                        </span>
                        <span className="px-1.5 sm:px-2 py-0.5 bg-green-600/20 border border-green-500/30  text-[10px] sm:text-xs text-green-400">
                          ✓ Matched
                        </span>
                      </div>

                      <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-2.5 sm:mb-3">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Borrower</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-white font-mono truncate">
                              {formatAddress(match.loan.borrower)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Amount</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-white font-semibold truncate">
                              {formatAmount(match.loan.plainRequestedAmount)} ETH
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Duration</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-white">
                              {match.loan.plainDuration} days
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Interest Rate</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-white">
                              {Number(match.offer.plainInterestRate) / 100}%
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                            <span>Lender:</span>
                            <span className="font-mono truncate ml-2">{formatAddress(match.offer.lender)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                            <span>Available:</span>
                            <span>{match.offer.availableFunds} ETH</span>
                          </div>
                          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400">
                            <span>Collateral:</span>
                            <span>{Number(match.offer.collateralPercentage) / 100}%</span>
                          </div>
                        </div>
                      </div>

                     
                      <button
                        onClick={() => handleFundLoan(match.loanId, match.offerId, match.offer.lender)}
                        disabled={funding || address?.toLowerCase() !== match.offer.lender.toLowerCase()}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#98E29D] text-gray-900 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-xs sm:text-sm font-medium transition"
                      >
                        {funding ? "Funding..." : "Fund Loan"}
                      </button>
                      {address?.toLowerCase() !== match.offer.lender.toLowerCase() && (
                        <p className="text-[10px] sm:text-xs text-slate-500 text-center mt-1.5 sm:mt-2">
                          Only lender can fund
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-3 sm:p-4 md:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 md:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">Active Loan Requests</h3>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] sm:text-xs font-medium w-fit">
                  {activeLoans.length} Active
                </span>
              </div>

              {activeLoans.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-2 sm:mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-slate-500 text-xs sm:text-sm">No active loan requests</p>
                  <p className="text-slate-600 text-[10px] sm:text-xs mt-1">
                    Check back later or create a request as a borrower
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                  {activeLoans.map(loan => {
                    const existingMatch = matchedPairs.find(m => m.loanId === loan.loanId);
                    const selectedOfferId = selectedMatches[loan.loanId];
                    const canMatch =
                      address &&
                      (address.toLowerCase() === loan.borrower.toLowerCase() ||
                        (selectedOfferId !== undefined &&
                          lenderOffers.find(o => o.offerId === selectedOfferId)?.lender.toLowerCase() ===
                            address.toLowerCase()));

                    return (
                      <div
                        key={loan.loanId}
                        className="bg-slate-900/50 border border-slate-700  p-2.5 sm:p-3 md:p-4 hover:border-blue-600/50 transition"
                      >
                        <div className="space-y-2.5 sm:space-y-3">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-300">
                              Loan #{loan.loanId}
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-600/20 border border-blue-500/30  text-[10px] sm:text-xs text-blue-400">
                              Active
                            </span>
                            {existingMatch && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-green-600/20 border border-green-500/30  text-[10px] sm:text-xs text-green-400">
                                Has Match
                              </span>
                            )}
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Borrower</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white font-mono truncate">
                                {formatAddress(loan.borrower)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Amount</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white font-semibold truncate">
                                {formatAmount(loan.plainRequestedAmount)} ETH
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Duration</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white">{loan.plainDuration} days</p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Requested On</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white">
                                {new Date(loan.timestamp * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <p className="text-[10px] sm:text-xs text-slate-500 italic">
                              Credit score and financial data encrypted via FHEVM
                            </p>
                          </div>

                          <div className="space-y-2">
                            {activeOffers.length > 0 ? (
                              <>
                                <select
                                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 border border-slate-600  text-white text-[11px] sm:text-xs md:text-sm focus:border-blue-500 focus:outline-none"
                                  value={selectedOfferId ?? -1}
                                  onChange={e => {
                                    const offerId = parseInt(e.target.value);
                                    if (offerId >= 0) {
                                      setSelectedMatches(prev => ({ ...prev, [loan.loanId]: offerId }));
                                    } else {
                                      setSelectedMatches(prev => {
                                        const updated = { ...prev };
                                        delete updated[loan.loanId];
                                        return updated;
                                      });
                                    }
                                  }}
                                  disabled={matching}
                                >
                                  <option value={-1}>Select an offer...</option>
                                  {activeOffers.map(offer => (
                                    <option key={offer.offerId} value={offer.offerId}>
                                      Offer #{offer.offerId} - {offer.availableFunds} ETH @{" "}
                                      {Number(offer.plainInterestRate) / 100}%
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    if (selectedOfferId !== undefined && selectedOfferId >= 0) {
                                      handleMatch(loan.loanId, selectedOfferId);
                                    }
                                  }}
                                  disabled={
                                    matching || selectedOfferId === undefined || selectedOfferId < 0 || !canMatch
                                  }
                                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-white text-xs sm:text-sm font-medium transition"
                                >
                                  {matching ? "Checking..." : "Check Match"}
                                </button>
                                {!canMatch && selectedOfferId !== undefined && selectedOfferId >= 0 && (
                                  <p className="text-[10px] sm:text-xs text-amber-400 text-center">
                                    Only borrower or lender can match
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-[10px] sm:text-xs text-slate-500 text-center py-2">
                                No offers available
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-3 sm:p-4 md:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 md:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">Active Lender Offers</h3>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-600/20 border border-purple-500/30  text-purple-400 text-[10px] sm:text-xs font-medium w-fit">
                  {activeOffers.length} Available
                </span>
              </div>

              {activeOffers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-2 sm:mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-slate-500 text-xs sm:text-sm">No active lender offers</p>
                  <p className="text-slate-600 text-[10px] sm:text-xs mt-1">
                    Create an offer as a lender to start matching
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                  {activeOffers.map(offer => {
                    const matchCount = matchedPairs.filter(m => m.offerId === offer.offerId).length;

                    return (
                      <div
                        key={offer.offerId}
                        className="bg-slate-900/50 border border-slate-700  p-2.5 sm:p-3 md:p-4 hover:border-purple-600/50 transition"
                      >
                        <div className="space-y-2.5 sm:space-y-3">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-300">
                              Offer #{offer.offerId}
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 bg-purple-600/20 border border-purple-500/30  text-[10px] sm:text-xs text-purple-400">
                              Active
                            </span>
                            {matchCount > 0 && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-green-600/20 border border-green-500/30  text-[10px] sm:text-xs text-green-400">
                                {matchCount} Match{matchCount > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Lender</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white font-mono truncate">
                                {formatAddress(offer.lender)}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Available Funds</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white font-semibold truncate">
                                {offer.availableFunds} ETH
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Max Loan Amount</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white">
                                {formatAmount(offer.plainMaxLoanAmount)} ETH
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">Interest Rate</p>
                              <p className="text-[11px] sm:text-xs md:text-sm text-white">
                                {Number(offer.plainInterestRate) / 100}%
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-400">
                            <span>Collateral: {Number(offer.collateralPercentage) / 100}%</span>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <p className="text-[10px] sm:text-xs text-slate-500 italic">
                              Min credit score threshold encrypted via FHEVM
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-3 sm:p-4 md:p-6 shadow-xl">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-3 sm:mb-4">
                How Confidential Matching Works
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    num: "1",
                    title: "Encrypted Credit Check",
                    desc: "Borrower's encrypted credit score is compared with lender's encrypted minimum threshold using FHE operations",
                  },
                  {
                    num: "2",
                    title: "Amount Verification",
                    desc: "Encrypted loan amount is compared with lender's encrypted max loan amount - all on-chain",
                  },
                  {
                    num: "3",
                    title: "Match Registration",
                    desc: "If criteria match, the pair is registered in loanOfferMatches mapping for funding",
                  },
                  {
                    num: "4",
                    title: "Secure Funding",
                    desc: "Lender funds the loan, collateral is locked, and repayment tracking begins automatically",
                  },
                ].map(step => (
                  <div key={step.num} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-blue-600/50  flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-[10px] sm:text-xs md:text-sm">{step.num}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-300 mb-0.5 sm:mb-1">{step.title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {loading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 shadow-2xl max-w-sm w-full">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="animate-spin rounded-full h-7 w-7 sm:h-8 sm:w-8 border-b-2 border-emerald-500 flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm sm:text-base">Loading Marketplace...</p>
                      <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                        Please wait while we fetch the latest data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </WalletAuthGuard>
  );
}
