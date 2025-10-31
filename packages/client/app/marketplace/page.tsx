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
      alert("❌ Only the borrower or lender can check this match");
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

      const amountWei = ethers.parseEther(formatAmount(match.loan.plainRequestedAmount));

      const amountEth = formatAmount(match.loan.plainRequestedAmount);

      const tx = await fundLoan(loanId, offerId, amountEth);
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

      alert(`❌ ${errorMessage}`);
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
      <div className="w-full min-h-screen p-8">
        <div className="max-w-4xl mx-auto ">
          <div className=" bg-slate-800/50 border   shadow-xl  border-white/10 w-full mt-24 p-4 space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50  p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-200">Error</p>
                    <p className="text-xs text-red-300/80 mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 transition">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Privacy Notice */}
            <div className="bg-blue-700/50 border  border-slate-700  p-4">
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm font-medium text-indigo-200"> Privacy-Preserving Matching</p>
                  <p className="text-xs text-indigo-300/80 mt-1">
                    Credit scores, income, and liabilities remain encrypted using FHEVM. Lenders never see sensitive
                    borrower data. Matching happens through encrypted comparisons on-chain.
                  </p>
                </div>
              </div>
            </div>

            {/* Matched Loans Ready for Funding */}
            {matchedPairs.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white"> Matched Loans (Ready for Funding)</h3>
                  <span className="px-3 py-1 bg-green-600/20 border border-green-500/30  text-green-400 text-xs font-medium">
                    {matchedPairs.length} Ready
                  </span>
                </div>

                <div className="space-y-4">
                  {matchedPairs.map(match => (
                    <div
                      key={`${match.loanId}-${match.offerId}`}
                      className="bg-slate-900/50 border border-green-600/30  p-6 hover:border-green-500/50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-300">
                              Loan #{match.loanId} + Offer #{match.offerId}
                            </span>
                            <span className="px-2 py-1 bg-green-600/20 border border-green-500/30  text-xs text-green-400">
                              ✓ Matched
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Borrower</p>
                              <p className="text-sm text-white font-mono">{formatAddress(match.loan.borrower)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Requested Amount</p>
                              <p className="text-sm text-white font-semibold">
                                {formatAmount(match.loan.plainRequestedAmount)} ETH
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Duration</p>
                              <p className="text-sm text-white">{match.loan.plainDuration} days</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
                              <p className="text-sm text-white">{Number(match.offer.plainInterestRate) / 100}%</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-xs text-slate-400">
                            <span>Lender: {formatAddress(match.offer.lender)}</span>
                            <span>Available: {match.offer.availableFunds} ETH</span>
                            <span>Collateral Required: {Number(match.offer.collateralPercentage) / 100}%</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleFundLoan(match.loanId, match.offerId, match.offer.lender)}
                            disabled={funding || address?.toLowerCase() !== match.offer.lender.toLowerCase()}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed  text-white text-sm font-medium transition whitespace-nowrap"
                          >
                            {funding ? "Funding..." : "Fund Loan"}
                          </button>
                          {address?.toLowerCase() !== match.offer.lender.toLowerCase() && (
                            <p className="text-xs text-slate-500">Only lender can fund</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Loan Requests */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white"> Active Loan Requests</h3>
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30  text-blue-400 text-xs font-medium">
                  {activeLoans.length} Active
                </span>
              </div>

              {activeLoans.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-3"
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
                  <p className="text-slate-500 text-sm">No active loan requests</p>
                  <p className="text-slate-600 text-xs mt-1">Check back later or create a request as a borrower</p>
                </div>
              ) : (
                <div className="space-y-4">
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
                        className="bg-slate-900/50 border border-slate-700  p-6 hover:border-blue-600/50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-300">Loan #{loan.loanId}</span>
                              <span className="px-2 py-1 bg-blue-600/20 border border-blue-500/30  text-xs text-blue-400">
                                Active
                              </span>
                              {existingMatch && (
                                <span className="px-2 py-1 bg-green-600/20 border border-green-500/30  text-xs text-green-400">
                                  Has Match
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Borrower</p>
                                <p className="text-sm text-white font-mono">{formatAddress(loan.borrower)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Amount Requested</p>
                                <p className="text-sm text-white font-semibold">
                                  {formatAmount(loan.plainRequestedAmount)} ETH
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Duration</p>
                                <p className="text-sm text-white">{loan.plainDuration} days</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Requested On</p>
                                <p className="text-sm text-white">
                                  {new Date(loan.timestamp * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                              <p className="text-xs text-slate-500 italic">
                                Credit score and financial data encrypted via FHEVM
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {activeOffers.length > 0 ? (
                              <>
                                <select
                                  className="px-3 py-2 bg-slate-800 border border-slate-600  text-white text-sm focus:border-blue-500 focus:outline-none"
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
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium transition"
                                >
                                  {matching ? "Checking..." : "Check Match"}
                                </button>
                                {!canMatch && selectedOfferId !== undefined && selectedOfferId >= 0 && (
                                  <p className="text-xs text-amber-400 text-center">
                                    Only borrower or lender can match
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-slate-500 text-center">No offers available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Lender Offers */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white"> Active Lender Offers</h3>
                <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30  text-purple-400 text-xs font-medium">
                  {activeOffers.length} Available
                </span>
              </div>

              {activeOffers.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-600 mx-auto mb-3"
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
                  <p className="text-slate-500 text-sm">No active lender offers</p>
                  <p className="text-slate-600 text-xs mt-1">Create an offer as a lender to start matching</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOffers.map(offer => {
                    const matchCount = matchedPairs.filter(m => m.offerId === offer.offerId).length;

                    return (
                      <div
                        key={offer.offerId}
                        className="bg-slate-900/50 border border-slate-700  p-6 hover:border-purple-600/50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-300">Offer #{offer.offerId}</span>
                              <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-xs text-purple-400">
                                Active
                              </span>
                              {matchCount > 0 && (
                                <span className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-xs text-green-400">
                                  {matchCount} Match{matchCount > 1 ? "es" : ""}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Lender</p>
                                <p className="text-sm text-white font-mono">{formatAddress(offer.lender)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Available Funds</p>
                                <p className="text-sm text-white font-semibold">{offer.availableFunds} ETH</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Max Loan Amount</p>
                                <p className="text-sm text-white">{formatAmount(offer.plainMaxLoanAmount)} ETH</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
                                <p className="text-sm text-white">{Number(offer.plainInterestRate) / 100}%</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>Collateral: {Number(offer.collateralPercentage) / 100}%</span>
                            </div>

                            <div className="pt-2 border-t border-slate-800">
                              <p className="text-xs text-slate-500 italic">
                                🔒 Min credit score threshold encrypted via FHEVM
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4"> How Confidential Matching Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/50  flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Encrypted Credit Check</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Borrower's encrypted credit score is compared with lender's encrypted minimum threshold using FHE
                      operations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/50  flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Amount Verification</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Encrypted loan amount is compared with lender's encrypted max loan amount - all on-chain
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Match Registration</p>
                    <p className="text-xs text-slate-500 mt-1">
                      If criteria match, the pair is registered in loanOfferMatches mapping for funding
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600/50  flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">Secure Funding</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Lender funds the loan, collateral is locked, and repayment tracking begins automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-800 border border-slate-700 p-8 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    <div>
                      <p className="text-white font-medium">Loading Marketplace...</p>
                      <p className="text-slate-400 text-sm">Please wait while we fetch the latest data</p>
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
