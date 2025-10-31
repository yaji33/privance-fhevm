"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createLenderOffer, encryptData, getContract, getLenderOffers } from "../lib/contract";
import { useFhevm } from "@fhevm-sdk";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface OfferForm {
  minCreditScore: string;
  maxLoanAmount: string;
  interestRate: string;
  fundingAmount: string;
  collateralPercentage: string;
}

export default function LenderDashboard() {
  const [form, setForm] = useState<OfferForm>({
    minCreditScore: "",
    maxLoanAmount: "",
    interestRate: "",
    fundingAmount: "",
    collateralPercentage: "100",
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
    const maxAmountInWei = ethers.parseEther(form.maxLoanAmount);
    const interestRate = BigInt(form.interestRate);
    const fundingAmount = form.fundingAmount;
    const collateralPercentage = BigInt(form.collateralPercentage);
    // Validation
    if (minScore < 300n || minScore > 850n) {
      alert("Minimum credit score must be between 300 and 850");
      return;
    }

    if (maxAmountInWei < ethers.parseEther("0.001")) {
      alert("Maximum loan amount must be at least 0.001 ETH");
      return;
    }

    if (interestRate <= 0n || interestRate > 10000n) {
      alert("Interest rate must be between 1 and 10000 basis points (0.01% to 100%)");
      return;
    }

    if (collateralPercentage < 0n || collateralPercentage > 10000n) {
      alert("Collateral percentage must be between 0 and 10000 (0% to 100%)");
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
        maxAmount: maxAmountInWei.toString(),
        interestRate: interestRate.toString(),
        fundingAmount: form.fundingAmount,
        collateralPercentage: collateralPercentage.toString(),
      });

      // Use the helper function from your contract interaction file
      const tx = await createLenderOffer(
        fhevmInstance,
        minScore,
        maxAmountInWei,
        interestRate,
        form.fundingAmount,
        address,
        Number(collateralPercentage),
      );

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
        collateralPercentage: "100",
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
      const lenderOffers = await getLenderOffers(address);
      setOffers(lenderOffers);
    } catch (err) {
      console.error("Error loading offers:", err);
    }
  };

  useEffect(() => {
    if (address) loadOffers();
  }, [address]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 px-8 py-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <p className="text-lg font-semibold text-white">Lender Dashboard</p>
        </div>
      </div>

      {/* Create Offer Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-6">Create New Lending Offer</h3>

        {!address && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 ">
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
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700  text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Only match borrowers with scores above this threshold</p>
          </div>

          {/* Maximum Loan Amount */}
          {/* Maximum Loan Amount - FIX THIS SECTION */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Loan Amount</label>
            <div className="relative">
              {/* CHANGE THIS LINE: $ → Ξ */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Ξ</span>
              <input
                type="number"
                placeholder="0.1"
                min="0.001"
                step="0.001"
                value={form.maxLoanAmount}
                onChange={e => setForm({ ...form, maxLoanAmount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700  text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>
            {/* UPDATE HELPER TEXT */}
            <p className="mt-1 text-xs text-slate-500">Maximum ETH amount you're willing to lend per borrower</p>
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
                className="w-full pr-12 px-4 py-3 bg-slate-900/70 border border-slate-700  text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700  text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Amount of ETH to deposit for lending</p>
          </div>
          {/* Collateral Percentage */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Collateral Requirement (%)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="100"
                min="0"
                max="10000"
                value={form.collateralPercentage}
                onChange={e => setForm({ ...form, collateralPercentage: e.target.value })}
                className="w-full pr-12 px-4 py-3 bg-slate-900/70 border border-slate-700  text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Collateral required as percentage of loan amount (100 = 1%, 10000 = 100%)
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !fhevmInstance || !address}
            className="w-full py-3 bg-[#98E29D] text-gray-900 disabled:from-slate-700 disabled:to-slate-700 font-medium transition-all duration-200 transform  active:scale-[0.98] shadow-lg  disabled:cursor-not-allowed"
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
        <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700">
          <div className="flex items-start gap-3 justify-center">
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
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Your Active Offers</h3>

        {offers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No active offers yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => (
              <div key={offer.id} className="bg-slate-900/60 p-4  border border-slate-700 flex justify-between">
                <div className="flex text-left flex-col">
                  <p className="text-sm text-slate-300">
                    Offer #{offer.id} — Interest {Number(offer.interestRate) / 100}% APR
                  </p>
                  <p className="text-xs text-slate-500">
                    Max Loan: {offer.maxLoanAmount?.toString()} — Min Score: {offer.minCreditScore?.toString()}
                  </p>
                </div>
                <div className="text-xs text-green-400 font-medium">ACTIVE</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
