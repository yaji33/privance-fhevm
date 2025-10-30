"use client";

import React, { useEffect, useState } from "react";
import { getContract, getLenderOffer, getLoanRequest } from "../lib/contract1";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface LoanRequest {
  loanId: number;
  borrower: string;
  timestamp: number;
  isActive: boolean;
  isFunded: boolean;
  lender: string;
}

interface LenderOffer {
  offerId: number;
  lender: string;
  availableFunds: string;
  isActive: boolean;
}

export default function MarketplaceMatching() {
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [lenderOffers, setLenderOffers] = useState<LenderOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const { address } = useAccount();

  // Load marketplace data
  const loadMarketplaceData = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const contract = await getContract();

      console.log("Loading marketplace data...");

      // Get the next IDs to know how many items exist
      const nextLoanId = await contract.nextLoanId();
      const nextOfferId = await contract.nextOfferId();

      console.log(`Found ${nextLoanId} loan requests, ${nextOfferId} offers`);

      // Load all loan requests
      const loans: LoanRequest[] = [];
      for (let i = 0; i < nextLoanId; i++) {
        try {
          const loanData = await getLoanRequest(i);
          if (loanData && loanData.borrower !== ethers.ZeroAddress) {
            loans.push({
              loanId: i,
              borrower: loanData.borrower,
              timestamp: Number(loanData.timestamp),
              isActive: loanData.isActive,
              isFunded: loanData.isFunded,
              lender: loanData.lender,
            });
          }
        } catch (error) {
          console.log(`Loan ${i} not found or error:`, error);
        }
      }

      // Load all lender offers
      const offers: LenderOffer[] = [];
      for (let i = 0; i < nextOfferId; i++) {
        try {
          const offerData = await getLenderOffer(i);
          if (offerData && offerData.lender !== ethers.ZeroAddress) {
            offers.push({
              offerId: i,
              lender: offerData.lender,
              availableFunds: ethers.formatEther(offerData.availableFunds),
              isActive: offerData.isActive,
            });
          }
        } catch (error) {
          console.log(`Offer ${i} not found or error:`, error);
        }
      }

      console.log("Loaded loans:", loans);
      console.log("Loaded offers:", offers);

      setLoanRequests(loans);
      setLenderOffers(offers);
    } catch (err) {
      console.error("Error loading marketplace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [address]);

  const handleMatch = async (loanId: number, offerId: number) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    setMatching(true);
    try {
      const contract = await getContract();

      console.log(`Matching loan ${loanId} with offer ${offerId}...`);

      const tx = await contract.checkLoanMatch(loanId, offerId, {
        gasLimit: 5000000,
      });

      const receipt = await tx.wait();
      console.log("Match checked in block:", receipt.blockNumber);

      alert("Match checked successfully! The encrypted criteria have been evaluated.");

      await loadMarketplaceData();
    } catch (err: any) {
      console.error("Error matching:", err);
      alert(`Failed to check match: ${err.message}`);
    } finally {
      setMatching(false);
    }
  };

  const handleFundLoan = async (loanId: number, offerId: number) => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    setMatching(true);
    try {
      const contract = await getContract();

      console.log(`Funding loan ${loanId} with offer ${offerId}...`);

      const tx = await contract.fundLoan(loanId, offerId, {
        gasLimit: 5000000,
      });

      const receipt = await tx.wait();
      console.log("Loan funded in block:", receipt.blockNumber);

      alert("Loan funded successfully! Funds have been transferred to the borrower.");

      await loadMarketplaceData();
    } catch (err: any) {
      console.error("Error funding loan:", err);
      alert(`Failed to fund loan: ${err.message}`);
    } finally {
      setMatching(false);
    }
  };

  // Filter to show only active, non-funded loans
  const activeLoans = loanRequests.filter(loan => loan.isActive && !loan.isFunded);
  const activeOffers = lenderOffers.filter(offer => offer.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-700 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lending Marketplace</h2>
              <p className="text-sm text-emerald-300">Browse and match confidential loans</p>
            </div>
          </div>
          <button
            onClick={loadMarketplaceData}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Active Loan Requests */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Active Loan Requests</h3>
          <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-medium">
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
            {activeLoans.map(loan => (
              <div
                key={loan.loanId}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-blue-600/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">Loan #{loan.loanId}</span>
                      <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-xs text-blue-400">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Borrower: {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Requested: {new Date(loan.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {activeOffers.length > 0 && (
                      <select
                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        onChange={e => {
                          const offerId = parseInt(e.target.value);
                          if (offerId >= 0) {
                            handleMatch(loan.loanId, offerId);
                          }
                        }}
                      >
                        <option value="-1">Match with offer...</option>
                        {activeOffers.map(offer => (
                          <option key={offer.offerId} value={offer.offerId}>
                            Offer #{offer.offerId} ({offer.availableFunds} ETH)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Lender Offers */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Active Lender Offers</h3>
          <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-xs font-medium">
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
            {activeOffers.map(offer => (
              <div
                key={offer.offerId}
                className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 hover:border-purple-600/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">Offer #{offer.offerId}</span>
                      <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded text-xs text-purple-400">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Lender: {offer.lender.slice(0, 6)}...{offer.lender.slice(-4)}
                    </p>
                    <p className="text-xs text-slate-500">Available Funds: {offer.availableFunds} ETH</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Show which loans this offer can match with
                        const matchableLoans = activeLoans.filter(
                          loan =>
                            // In a real app, you'd check encrypted matching here
                            true, // For now, show all loans
                        );
                        if (matchableLoans.length > 0) {
                          alert(`This offer can potentially match with ${matchableLoans.length} active loans`);
                        } else {
                          alert("No matching loans found for this offer");
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition"
                    >
                      Check Matches
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How Matching Works */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">How Confidential Matching Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Encrypted Comparison</p>
              <p className="text-xs text-slate-500 mt-1">
                Borrower's credit score is compared with lender's minimum threshold using FHE
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Amount Verification</p>
              <p className="text-xs text-slate-500 mt-1">
                Requested loan amount is checked against lender's maximum offer amount
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Automatic Matching</p>
              <p className="text-xs text-slate-500 mt-1">
                If both conditions pass, the loan is marked as matched and ready for funding
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-slate-400">
              All matching happens on encrypted data. Neither party sees the other's sensitive information until
              funding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
