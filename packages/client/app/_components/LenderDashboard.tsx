"use client";

import React, { useMemo, useState } from "react";
import { createLenderOffer, encryptData, getContract } from "../lib/contract1";
import { useFhevm } from "@fhevm-sdk";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface OfferForm {
  minCreditScore: string;
  maxLoanAmount: string;
  interestRate: string;
  fundingAmount: string;
}

export default function LenderDashboard() {
  const [form, setForm] = useState<OfferForm>({
    minCreditScore: "",
    maxLoanAmount: "",
    interestRate: "",
    fundingAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const { address, chain } = useAccount();

  const chainId = chain?.id;

  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum;
  }, []);

  const initialMockChains = { 31337: "http://localhost:8545" };

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: !!provider && !!chainId && !!address,
  });

  const toHexString = (bytes: Uint8Array) =>
    "0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("\n=== LENDER OFFER DEBUG ===");
    console.log("Form data:", form);
    console.log("Connected address:", address);
    console.log("FHEVM instance:", fhevmInstance ? "Ready" : "Not ready");

    if (!fhevmInstance || !address) {
      alert("Please connect your wallet and wait for initialization.");
      return;
    }

    const minScore = BigInt(form.minCreditScore);
    const maxAmount = BigInt(form.maxLoanAmount);
    const interestRate = BigInt(form.interestRate);
    const fundingAmount = form.fundingAmount;

    // Validation
    if (minScore < 300n || minScore > 850n) {
      alert("Minimum credit score must be between 300 and 850");
      return;
    }

    if (maxAmount <= 0n) {
      alert("Maximum loan amount must be greater than 0");
      return;
    }

    if (interestRate <= 0n || interestRate > 10000n) {
      alert("Interest rate must be between 1 and 10000 basis points (0.01% to 100%)");
      return;
    }

    if (!form.fundingAmount || parseFloat(form.fundingAmount) <= 0) {
      alert("Please enter a valid funding amount");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating lender offer with parameters:", {
        minScore: minScore.toString(),
        maxAmount: maxAmount.toString(),
        interestRate: interestRate.toString(),
        fundingAmount: form.fundingAmount,
      });

      // Use the helper function from your contract interaction file
      const tx = await createLenderOffer(fhevmInstance, minScore, maxAmount, interestRate, form.fundingAmount, address);

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction was mined but failed");
      }

      console.log("Lender offer created in block:", receipt.blockNumber);
      alert("Lending offer created successfully! Your funds are now available for matching.");

      // Reset form
      setForm({
        minCreditScore: "",
        maxLoanAmount: "",
        interestRate: "",
        fundingAmount: "",
      });

      // Refresh offers list
      await loadOffers();
    } catch (err: any) {
      console.error("Error creating offer:", err);

      // Detailed error handling
      let errorMessage = "Failed to create lender offer: ";

      if (err.code === "CALL_EXCEPTION") {
        console.error("Call exception details:", {
          data: err.data,
          reason: err.reason,
          transaction: err.transaction,
        });

        if (err.reason) {
          errorMessage += err.reason;
        } else {
          errorMessage += "Contract execution reverted. Check contract deployment and parameters.";
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Unknown error occurred";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!address) return;

    try {
      const contract = await getContract();
      // In production, implement proper event listening or indexing
      // For MVP, simplified approach
      console.log("Loading offers...");
    } catch (err) {
      console.error("Error loading offers:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-700 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Lender Dashboard</h2>
            <p className="text-sm text-purple-300">Create confidential lending offers</p>
          </div>
        </div>
      </div>

      {/* Create Offer Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-6">Create New Lending Offer</h3>

        {!address && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <p className="text-amber-400 text-sm">⚠️ Connect your wallet to create offers</p>
          </div>
        )}

        <form onSubmit={handleCreateOffer} className="space-y-5">
          {/* Minimum Credit Score */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Credit Score</label>
            <input
              type="number"
              placeholder="650"
              min="300"
              max="850"
              value={form.minCreditScore}
              onChange={e => setForm({ ...form, minCreditScore: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Only match borrowers with scores above this threshold</p>
          </div>

          {/* Maximum Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Loan Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                placeholder="10000"
                min="1"
                value={form.maxLoanAmount}
                onChange={e => setForm({ ...form, maxLoanAmount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Maximum amount you're willing to lend per borrower</p>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (APR)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="500"
                min="0"
                max="10000"
                value={form.interestRate}
                onChange={e => setForm({ ...form, interestRate: e.target.value })}
                className="w-full pr-12 px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">bps</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Basis points (100 bps = 1%, 500 bps = 5%)</p>
          </div>

          {/* Funding Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Funding Amount (ETH)</label>
            <input
              type="text"
              placeholder="0.1"
              value={form.fundingAmount}
              onChange={e => setForm({ ...form, fundingAmount: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Amount of ETH to deposit for lending</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !fhevmInstance || !address}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Offer...
              </span>
            ) : !address ? (
              "Connect Wallet"
            ) : !fhevmInstance ? (
              "Initializing..."
            ) : (
              "Create Lending Offer"
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">
                Your lending criteria are encrypted on-chain. Borrowers cannot see your specific requirements.
              </p>
              <p className="text-xs text-slate-500">
                ✓ Confidential matching ✓ Automated risk assessment ✓ Trustless execution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Offers Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Your Active Offers</h3>
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-500 text-sm">No active offers yet</p>
          <p className="text-slate-600 text-xs mt-1">Create your first offer to start lending</p>
        </div>
      </div>
    </div>
  );
}
