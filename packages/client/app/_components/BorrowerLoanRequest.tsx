"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createLoanRequest, getBorrowerLoans, getContract } from "../lib/contract1";
import { useFhevm } from "@fhevm-sdk";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

interface LoanForm {
  requestedAmount: string;
  duration: string;
}

export default function BorrowerLoanRequest() {
  const [form, setForm] = useState<LoanForm>({
    requestedAmount: "",
    duration: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasScore, setHasScore] = useState(false);
  const { address, chain } = useAccount();
  const [loanRequests, setLoanRequests] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

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

  // Check if user has computed credit score
  useEffect(() => {
    const checkScore = async () => {
      if (!address) return;
      try {
        const contract = await getContract();
        const score = await contract.hasCreditScore();
        setHasScore(score);
      } catch (err) {
        console.error("Error checking score:", err);
      }
    };
    checkScore();
  }, [address]);

  useEffect(() => {
    if (!address) return;
    (async () => {
      setLoadingLoans(true);
      try {
        const contract = await getContract();
        const totalLoans = await contract.nextLoanId();
        const loans: any[] = [];

        for (let i = 0; i < Number(totalLoans); i++) {
          const loan = await contract.loanRequests(i);
          if (loan.borrower.toLowerCase() === address.toLowerCase()) {
            loans.push({
              id: i,
              borrower: loan.borrower,
              amount: loan.plainRequestedAmount.toString(),
              duration: loan.plainDuration.toString(),
              status: loan.isFunded ? "Funded" : loan.isActive ? "Pending" : "Closed",
            });
          }
        }

        setLoanRequests(loans);
      } catch (err) {
        console.error("Error fetching borrower loans:", err);
      } finally {
        setLoadingLoans(false);
      }
    })();
  }, [address]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("\n=== LOAN REQUEST DEBUG INFO ===");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Connected address:", address);
    console.log("Chain ID:", chainId);
    console.log("FHEVM Instance:", fhevmInstance ? "✓ Ready" : "✗ Not ready");
    console.log("Has Score:", hasScore);
    console.log("Requested Amount:", form.requestedAmount);
    console.log("Duration:", form.duration);
    console.log("================================\n");

    if (!fhevmInstance || !address) {
      alert("Please connect your wallet and wait for initialization.");
      return;
    }

    if (!hasScore) {
      alert("Please compute your credit score first!");
      return;
    }

    const amountInWei = ethers.parseEther(form.requestedAmount);
    const duration = BigInt(form.duration);

    if (amountInWei <= 0n) {
      alert("Requested amount must be greater than 0");
      return;
    }

    if (duration < 1n || duration > 60n) {
      alert("Duration must be between 1 and 60 months");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating loan request...");
      console.log("Amount:", amountInWei.toString());
      console.log("Duration:", duration.toString());

      // Use the helper function from your contract interaction file
      const tx = await createLoanRequest(fhevmInstance, amountInWei, duration, address);

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction was mined but failed");
      }

      console.log("Loan request created in block:", receipt.blockNumber);

      alert("Loan request created successfully! Lenders can now match with your request.");

      setForm({
        requestedAmount: "",
        duration: "",
      });
    } catch (err: any) {
      console.error("Error creating loan request:", err);

      let errorMessage = "Failed to create loan request: ";

      if (err.message.includes("must have credit score")) {
        errorMessage = "You must compute your credit score first before requesting a loan.";
      } else if (err.reason) {
        errorMessage += err.reason;
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

  return (
    <div className="space-y-6">
  
      <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 backdrop-blur-sm border border-blue-700 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Loan Request</h2>
            <p className="text-sm text-blue-300">Request a confidential loan</p>
          </div>
        </div>
      </div>

     
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-6">Create Loan Request</h3>

        {!address && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <p className="text-amber-400 text-sm">⚠️ Connect your wallet to request a loan</p>
          </div>
        )}

        {address && !hasScore && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
            <p className="text-red-400 text-sm">⚠️ You must compute your credit score before requesting a loan</p>
          </div>
        )}

        <form onSubmit={handleCreateRequest} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Requested Loan Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Ξ</span>
              <input
                type="number"
                placeholder="0.1"
                min="0.001"
                step="0.001"
                value={form.requestedAmount}
                onChange={e => setForm({ ...form, requestedAmount: e.target.value })}
                className="w-full pl-8 pr-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <p className="mt-1 text-xs text-slate-500">Amount in ETH (min: 0.001 ETH)</p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Loan Duration (months)</label>
            <input
              type="number"
              placeholder="12"
              min="1"
              max="60"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Repayment period (1-60 months)</p>
          </div>

         
          <button
            type="submit"
            disabled={loading || !fhevmInstance || !address || !hasScore}
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
                Creating Request...
              </span>
            ) : !address ? (
              "Connect Wallet"
            ) : !hasScore ? (
              "Compute Credit Score First"
            ) : !fhevmInstance ? (
              "Initializing..."
            ) : (
              "Create Loan Request"
            )}
          </button>
        </form>

       
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">
                Your loan details are encrypted. Lenders will only see if they match your profile, not the exact
                amounts.
              </p>
              <p className="text-xs text-slate-500">
                ✓ Privacy-preserving matching ✓ Automated qualification ✓ Secure funding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Status Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Your Loan Requests</h3>
        {loadingLoans ? (
          <div className="text-center py-8 text-slate-400">Loading your loan requests...</div>
        ) : loanRequests.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-slate-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0..." />
            </svg>
            <p className="text-slate-500 text-sm">No active loan requests</p>
            <p className="text-slate-600 text-xs mt-1">Create a request to get matched with lenders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loanRequests.map(loan => (
              <div
                key={loan.id}
                className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 hover:border-blue-600 transition"
              >
                <h4 className="text-white font-medium mb-2">Loan #{loan.id}</h4>
                <p className="text-slate-400 text-sm">Amount: ${loan.amount}</p>
                <p className="text-slate-400 text-sm">Duration: {loan.duration} months</p>
                <p
                  className={`text-sm font-medium mt-2 ${
                    loan.status === "Pending"
                      ? "text-yellow-400"
                      : loan.status === "Matched"
                        ? "text-green-400"
                        : "text-slate-500"
                  }`}
                >
                  Status: {loan.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
