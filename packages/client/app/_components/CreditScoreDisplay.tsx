"use client";

import React, { useState } from "react";
import { getContract } from "../lib/contract";

export default function CreditScoreDisplay() {
  const [score, setScore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const computeScore = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.computeCreditScore();
      await tx.wait();
      const creditScore = await contract.getCreditScore();
      setScore(creditScore.toString());
    } catch (err) {
      console.error("Error computing score:", err);
      alert("Failed to compute credit score. Check console for details.");
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
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Credit Score Analysis</h2>

      {/* Score Display */}
      {score ? (
        <div className="space-y-6">
          {/* Main Score Card */}
          <div className={`bg-gradient-to-br ${getScoreColor(score)} rounded-2xl p-8 text-center shadow-xl`}>
            <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">Your Credit Score</p>
            <p className="text-6xl font-bold text-white mb-2">{score}</p>
            <p className={`text-lg font-semibold ${getScoreRating(score).color}`}>{getScoreRating(score).text}</p>
          </div>

          {/* Score Breakdown */}
          <div className="bg-slate-900/70 rounded-xl p-6 border border-slate-700">
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

          {/* Recompute Button */}
          <button
            onClick={computeScore}
            disabled={loading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-xl text-white font-medium transition-all duration-200 border border-slate-600"
          >
            {loading ? "Recomputing..." : "Recompute Score"}
          </button>
        </div>
      ) : (
        <div className="text-center space-y-6">
          {/* Illustration Placeholder */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-slate-700/50 rounded-full flex items-center justify-center border-4 border-slate-700">
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

          <button
            onClick={computeScore}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-emerald-500/50"
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
                Computing...
              </span>
            ) : (
              "Compute Credit Score"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
