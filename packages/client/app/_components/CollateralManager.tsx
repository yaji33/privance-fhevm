"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  depositCollateral,
  getAvailableCollateral,
  getTotalLockedCollateral,
  getUserCollateral,
  withdrawCollateral,
} from "../lib/contract1";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

export default function CollateralManager() {
  const { address } = useAccount();
  const [collateralBalance, setCollateralBalance] = useState("0");
  const [lockedCollateral, setLockedCollateral] = useState("0");
  const [availableCollateral, setAvailableCollateral] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollateralData = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setError(null);

      const [total, locked, available] = await Promise.all([
        getUserCollateral(address),
        getTotalLockedCollateral(address),
        getAvailableCollateral(address),
      ]);

      setCollateralBalance(ethers.formatEther(total));
      setLockedCollateral(ethers.formatEther(locked));
      setAvailableCollateral(ethers.formatEther(available));
    } catch (err: any) {
      console.error("Error loading collateral data:", err);
      setError("Failed to load collateral data");
    }
  }, [address]);

  const handleDeposit = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const confirmed = window.confirm(
      `Deposit ${depositAmount} ETH as collateral?\n\n` + `This will be available for securing loans.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Depositing ${depositAmount} ETH as collateral...`);

      const tx = await depositCollateral(depositAmount);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      console.log("Collateral deposited in block:", receipt.blockNumber);
      alert(`✅ Successfully deposited ${depositAmount} ETH as collateral!`);

      setDepositAmount("");
      await loadCollateralData();
    } catch (err: any) {
      console.error("Error depositing collateral:", err);

      let errorMessage = "Failed to deposit collateral";

      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance";
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(`${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const withdrawValue = parseFloat(withdrawAmount);
    const availableValue = parseFloat(availableCollateral);

    if (withdrawValue > availableValue) {
      alert(
        `Cannot withdraw ${withdrawAmount} ETH.\n\n` +
          `Available: ${availableCollateral} ETH\n` +
          `Locked: ${lockedCollateral} ETH\n\n` +
          `You can only withdraw available (unlocked) collateral.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Withdraw ${withdrawAmount} ETH from collateral?\n\n` +
        `Available: ${availableCollateral} ETH\n` +
        `After withdrawal: ${(availableValue - withdrawValue).toFixed(4)} ETH`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Withdrawing ${withdrawAmount} ETH from collateral...`);

      const tx = await withdrawCollateral(withdrawAmount);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      console.log("Collateral withdrawn in block:", receipt.blockNumber);
      alert(`Successfully withdrew ${withdrawAmount} ETH!`);

      setWithdrawAmount("");
      await loadCollateralData();
    } catch (err: any) {
      console.error("Error withdrawing collateral:", err);

      let errorMessage = "Failed to withdraw collateral";

      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction cancelled by user";
      } else if (err.message?.includes("Insufficient collateral")) {
        errorMessage = "Insufficient collateral balance";
      } else if (err.message?.includes("Collateral is locked")) {
        errorMessage = "Cannot withdraw locked collateral. Pay off active loans first.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(`${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const setMaxWithdraw = () => {
    setWithdrawAmount(availableCollateral);
  };

  useEffect(() => {
    loadCollateralData();
  }, [loadCollateralData]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
    
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Collateral Management</h3>
            <p className="text-sm text-slate-400">Secure your loans with ETH collateral</p>
          </div>
        </div>
        <button
          onClick={loadCollateralData}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition"
        >
          Refresh
        </button>
      </div>

   
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-xl p-4">
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

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-slate-400">Total Collateral</p>
          </div>
          <p className="text-2xl font-bold text-white">{collateralBalance} ETH</p>
        </div>

        <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 border border-amber-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-400">Locked</p>
          </div>
          <p className="text-2xl font-bold text-amber-300">{lockedCollateral} ETH</p>
          <p className="text-xs text-amber-400/60 mt-1">Securing active loans</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border border-emerald-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-emerald-400">Available</p>
          </div>
          <p className="text-2xl font-bold text-emerald-300">{availableCollateral} ETH</p>
          <p className="text-xs text-emerald-400/60 mt-1">Ready to withdraw</p>
        </div>
      </div>

  
      <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-6 mb-4">
        <h4 className="text-sm font-semibold text-white mb-4">💰 Deposit Collateral</h4>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="Amount (ETH)"
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !depositAmount || !address}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition whitespace-nowrap"
          >
            {loading ? "Depositing..." : "Deposit"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Deposit ETH to use as collateral for borrowing. Minimum: 0.001 ETH
        </p>
      </div>


      <div className="bg-slate-900/30 border border-slate-700 rounded-xl p-6 mb-4">
        <h4 className="text-sm font-semibold text-white mb-4">🏦 Withdraw Collateral</h4>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              step="0.001"
              min="0"
              max={availableCollateral}
              placeholder="Amount (ETH)"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={setMaxWithdraw}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition"
              disabled={loading}
            >
              Max
            </button>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || !address || parseFloat(availableCollateral) === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition whitespace-nowrap"
          >
            {loading ? "Withdrawing..." : "Withdraw"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Available to withdraw: {availableCollateral} ETH (locked collateral cannot be withdrawn)
        </p>
      </div>


      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-200">How Collateral Works</p>
            <ul className="text-xs text-indigo-300/80 mt-2 space-y-1 list-disc list-inside">
              <li>Deposit ETH as collateral to secure loans</li>
              <li>Locked collateral is held during active loans</li>
              <li>Collateral is released after successful repayment</li>
              <li>Defaulted loans result in collateral liquidation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
