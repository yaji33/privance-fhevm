"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getContract } from "../lib/contract";
import { useFhevm } from "@fhevm-sdk";
import type { HandleContractPair } from "@zama-fhe/relayer-sdk/bundle";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export default function CreditScoreDisplay() {
  const [score, setScore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const { address, chain } = useAccount();

  const stableProvider = useMemo(() => {
    if (typeof window === "undefined") return null;
    const eth = (window as any).ethereum;
    if (!eth) {
      console.warn("No Ethereum provider found");
      return null;
    }
    return eth;
  }, []);

  const stableChainId = useRef(chain?.id);
  useEffect(() => {
    if (chain?.id) stableChainId.current = chain.id;
  }, [chain?.id]);

  const initialMockChains = { 31337: "http://localhost:8545" };

  const { instance: fhevmInstance } = useFhevm({
    provider: stableProvider,
    chainId: stableChainId.current,
    initialMockChains,
    enabled: !!stableProvider && !!stableChainId.current && !!address,
  });

  const decryptScore = async () => {
    if (!fhevmInstance) {
      alert("FHEVM instance not initialized. Please wait and try again.");
      return;
    }
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }

    setDecrypting(true);
    try {
      setLoadingStep("Fetching encrypted score...");
      const contract = await getContract();
      const result = await contract.getCreditScore();
      const encryptedScore = typeof result === "string" ? result : result.handle || result[0]?.handle;

      if (!encryptedScore) {
        throw new Error("No encrypted score handle returned from contract.");
      }

      console.log("Encrypted score handle:", encryptedScore);

      setLoadingStep("Generating decryption keys...");
      const { publicKey, privateKey } = await fhevmInstance.generateKeypair();

      setLoadingStep("Creating signature request...");
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;

      const eip712Payload: any =
        typeof fhevmInstance.createEIP712 === "function"
          ? fhevmInstance.createEIP712(publicKey, [CONTRACT_ADDRESS], startTimestamp, durationDays)
          : (() => {
              throw new Error("fhevmInstance.createEIP712 not available — see SDK docs to build EIP712 payload.");
            })();

      setLoadingStep("Please sign the decryption request...");
      const ethProvider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await ethProvider.getSigner();

      const { domain, types, message } = eip712Payload;
      const cleanedTypes = Object.fromEntries(
        Object.entries(types).filter(([key]) => key !== "EIP712Domain"),
      ) as Record<string, ethers.TypedDataField[]>;

      const signature = await signer.signTypedData(domain, cleanedTypes, message);

      const handles = [
        {
          handle: encryptedScore,
          contractAddress: CONTRACT_ADDRESS,
        } as HandleContractPair,
      ];

      setLoadingStep("Decrypting your score...");
      const decrypted = await fhevmInstance.userDecrypt(
        handles,
        privateKey,
        publicKey,
        signature,
        [CONTRACT_ADDRESS],
        address,
        startTimestamp,
        durationDays,
      );

      console.log("Decrypted value:", decrypted);

      const scoreValue = decrypted[encryptedScore];

      if (scoreValue === undefined) {
        throw new Error("Failed to extract decrypted score value");
      }

      setScore(scoreValue.toString());
      setLoadingStep("");
    } catch (err) {
      console.error("Error decrypting score:", err);
      alert("Failed to decrypt credit score. Check console for details.");
      setLoadingStep("");
    } finally {
      setDecrypting(false);
    }
  };

  const computeScore = async () => {
    if (!address) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!fhevmInstance) {
      alert("FHEVM instance not initialized. Please wait and try again.");
      return;
    }

    setLoading(true);
    try {
      setLoadingStep("Submitting computation transaction...");
      const contract = await getContract();
      const tx = await contract.computeCreditScore();

      setLoadingStep("Waiting for blockchain confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log("Credit score computed successfully!");

        // Add a small delay to ensure the contract state is updated
        setLoadingStep("Preparing to decrypt...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        await decryptScore();
      }
    } catch (err) {
      console.error("Error computing score:", err);
      alert("Failed to compute credit score. Check console for details.");
      setLoadingStep("");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseInt(score);
    if (numScore >= 750) return "from-emerald-500 to-green-500";
    if (numScore >= 650) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreRating = (score: string) => {
    const numScore = parseInt(score);
    if (numScore >= 750) return { text: "Excellent", color: "text-emerald-400" };
    if (numScore >= 650) return { text: "Good", color: "text-yellow-400" };
    return { text: "Needs Improvement", color: "text-red-400" };
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Credit Score Analysis</h2>

      {!address && (
        <div className="mb-6 p-4 bg-amber-900/30  border border-amber-500/30">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-300">Please connect your wallet first to compute your credit score.</p>
          </div>
        </div>
      )}

      {score ? (
        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${getScoreColor(score)}  p-8 text-center shadow-xl`}>
            <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">Your Credit Score</p>
            <p className="text-6xl font-bold text-white mb-2">{score}</p>
            <p className={`text-lg font-semibold ${getScoreRating(score).color}`}>{getScoreRating(score).text}</p>
          </div>

          <div className="bg-slate-900/70 p-6 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Score Range</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Excellent</span>
                <span className="text-emerald-400 font-medium">750+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Good</span>
                <span className="text-yellow-400 font-medium">650-749</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Fair</span>
                <span className="text-red-400 font-medium">Below 650</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={computeScore}
              disabled={loading}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800  text-white font-medium transition-all duration-200 border border-slate-600"
            >
              {loading ? "Recomputing..." : "Recompute Score"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-slate-700/50  flex items-center justify-center border-4 border-slate-700">
              <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-slate-300 font-medium">Ready to compute your credit score?</p>
            <p className="text-slate-500 text-sm">Submit your data first, then click the button below</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={computeScore}
              disabled={loading || decrypting || !address || !fhevmInstance}
              className="w-full py-3 bg-[#98E29D] text-gray-900 font-medium "
            >
              {loading || decrypting ? (
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
                  {loadingStep || "Processing..."}
                </span>
              ) : !fhevmInstance ? (
                "Initializing encryption..."
              ) : (
                "Compute & View Credit Score"
              )}
            </button>
          </div>

          {(loading || decrypting) && loadingStep && (
            <div className="mt-4 p-4 bg-indigo-900/30 border border-indigo-500/30">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
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
                <p className="text-sm text-indigo-300">{loadingStep}</p>
              </div>
            </div>
          )}

          <div className="mt-6 bg-slate-900/50  border border-slate-700 flex justify-center">
            <div className="flex items-start gap-3">
              <p className="text-sm text-slate-400">
                Your score remains encrypted on-chain. Only you can decrypt and view it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
