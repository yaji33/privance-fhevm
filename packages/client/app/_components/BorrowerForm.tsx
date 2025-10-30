"use client";

import React, { useMemo, useState } from "react";
import { encryptData, getContract } from "../lib/contract1";
import { useFhevm } from "@fhevm-sdk";
import { useAccount } from "wagmi";

interface FormData {
  income: string;
  repaymentScore: string;
  liabilities: string;
}

export default function BorrowerForm() {
  const [form, setForm] = useState<FormData>({
    income: "",
    repaymentScore: "",
    liabilities: "",
  });
  const [loading, setLoading] = useState(false);
  const { address, chain } = useAccount();

  const chainId = chain?.id;

  // Create EIP-1193 provider from wagmi for FHEVM
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fhevmInstance) {
      alert("FHEVM instance not initialized. Please wait and try again.");
      return;
    }

    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    // Validate inputs
    const income = BigInt(form.income);
    const repaymentScore = BigInt(form.repaymentScore);
    const liabilities = BigInt(form.liabilities);

    if (income === 0n) {
      alert("Income cannot be zero");
      return;
    }

    if (repaymentScore > 100n) {
      alert("Repayment score must be between 0 and 100");
      return;
    }

    setLoading(true);

    try {
      console.log("=== Starting Submission ===");
      console.log("Input values:", { income, repaymentScore, liabilities });
      console.log("User address:", address);

      // Step 1: Encrypt each value using FHEVM
      console.log("Encrypting income...");
      const incomeEncrypted = await encryptData(fhevmInstance, income, address);

      console.log("Encrypting repayment score...");
      const repaymentScoreEncrypted = await encryptData(fhevmInstance, repaymentScore, address);

      console.log("Encrypting liabilities...");
      const liabilitiesEncrypted = await encryptData(fhevmInstance, liabilities, address);

      console.log("All values encrypted successfully");
      console.log("Encrypted handles:", {
        income: incomeEncrypted.handles[0],
        repaymentScore: repaymentScoreEncrypted.handles[0],
        liabilities: liabilitiesEncrypted.handles[0],
      });

      // Step 2: Get contract instance
      console.log("Getting contract instance...");
      const contract = await getContract();
      console.log("Contract loaded");

      // Step 3: Prepare transaction parameters (6 params total)
      const params = [
        incomeEncrypted.handles[0], // externalEuint64
        toHexString(incomeEncrypted.inputProof), // bytes
        repaymentScoreEncrypted.handles[0], // externalEuint64
        toHexString(repaymentScoreEncrypted.inputProof), // bytes
        liabilitiesEncrypted.handles[0], // externalEuint64
        toHexString(liabilitiesEncrypted.inputProof), // bytes
      ];

      console.log("Transaction parameters prepared (6 params)");

      // Step 4: Estimate gas to catch errors early
      console.log("Estimating gas...");
      try {
        const gasEstimate = await contract.submitBorrowerData.estimateGas(...params);
        console.log("Gas estimate:", gasEstimate.toString());
      } catch (gasError: any) {
        console.error("Gas estimation failed:", gasError);
        throw new Error(`Transaction would fail: ${gasError.message}`);
      }

      // Step 5: Submit transaction with extra gas for FHEVM operations
      console.log("Submitting transaction...");
      const tx = await contract.submitBorrowerData(...params, {
        gasLimit: 5000000, 
      });

      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());

      alert("Data submitted successfully! Your information is encrypted on-chain.");

    
      setForm({
        income: "",
        repaymentScore: "",
        liabilities: "",
      });
    } catch (err: any) {
      console.error("Submission error:", err);

     
      let errorMessage = "Transaction failed. ";

      if (err.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user.";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees.";
      } else if (err.message.includes("nonce")) {
        errorMessage = "Nonce error. Please try again.";
      } else if (err.message.includes("execution reverted")) {
        errorMessage =
          "Contract execution reverted. Please check:\n" +
          "1. Contract is properly deployed\n" +
          "2. FHEVM gateway is running\n" +
          "3. You're on the correct network\n" +
          "4. Input values are valid";
      } else if (err.reason) {
        errorMessage += `Reason: ${err.reason}`;
      } else if (err.message) {
        errorMessage += err.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Submit Your Information</h2>

      {!address && (
        <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <p className="text-amber-400 text-sm">⚠️ Please connect your wallet to continue</p>
        </div>
      )}

      {address && !fhevmInstance && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-blue-400 text-sm">ℹ️ Initializing encryption system...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
    
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Annual Income</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              placeholder="50000"
              value={form.income}
              onChange={e => setForm({ ...form, income: e.target.value })}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
              min="1"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Must be greater than 0</p>
        </div>

     
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Repayment Score</label>
          <input
            type="number"
            placeholder="0-100"
            min="0"
            max="100"
            value={form.repaymentScore}
            onChange={e => setForm({ ...form, repaymentScore: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
          />
          <p className="mt-1 text-xs text-slate-500">Enter a score between 0 and 100</p>
        </div>

  
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Total Liabilities</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              placeholder="10000"
              value={form.liabilities}
              onChange={e => setForm({ ...form, liabilities: e.target.value })}
              className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
              min="0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !fhevmInstance || !address}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed"
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
              Encrypting & Submitting...
            </span>
          ) : !address ? (
            "Connect wallet first"
          ) : !fhevmInstance ? (
            "Initializing encryption..."
          ) : (
            "Submit Encrypted Data"
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="space-y-1">
            <p className="text-sm text-slate-400">
              Your data is fully encrypted using homomorphic encryption before being sent to the blockchain
            </p>
            <p className="text-xs text-slate-500">
              ✓ End-to-end encryption ✓ Privacy-preserving computation ✓ No plaintext exposure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
