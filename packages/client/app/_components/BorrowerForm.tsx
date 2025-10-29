"use client";

import React, { useState } from "react";
import { getContract } from "../lib/contract";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.submitBorrowerData(
        BigInt(form.income),
        BigInt(form.repaymentScore),
        BigInt(form.liabilities),
      );
      await tx.wait();
      alert("Data submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Submit Your Information</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Income Input */}
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
            />
          </div>
        </div>

        {/* Repayment Score Input */}
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

        {/* Liabilities Input */}
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
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
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
              Submitting...
            </span>
          ) : (
            "Submit Data"
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
          <p className="text-sm text-slate-400">Your data is encrypted and processed securely on the blockchain</p>
        </div>
      </div>
    </div>
  );
}
