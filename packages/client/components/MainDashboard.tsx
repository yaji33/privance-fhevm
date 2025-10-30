"use client";

import React, { useState } from "react";
import BorrowerForm from "../app/_components/BorrowerForm";
import BorrowerLoanRequest from "../app/_components/BorrowerLoanRequest";
import CreditScoreDisplay from "../app/_components/CreditScoreDisplay";
import LenderDashboard from "../app/_components/LenderDashboard";
import MarketplaceMatching from "../app/_components/MarketPlaceMatching";
import WalletConnect from "../app/_components/WalletConnect";

type ViewMode = "borrower" | "lender" | "marketplace";

export default function MainDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("borrower");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-white">Privance</h1>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setViewMode("borrower")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === "borrower"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Borrower
              </button>
              <button
                onClick={() => setViewMode("lender")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === "lender"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Lender
              </button>
              <button
                onClick={() => setViewMode("marketplace")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  viewMode === "marketplace"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Wallet Connection - Always visible */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {/* Conditional Content Based on View Mode */}
        {viewMode === "borrower" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Borrower Portal</h2>
              <p className="text-blue-200">
                Submit your financial data confidentially and get matched with lenders based on your encrypted credit
                score.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <BorrowerForm />
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <CreditScoreDisplay />
              </div>
            </div>

            {/* Loan Request Section */}
            <BorrowerLoanRequest />
          </div>
        )}

        {viewMode === "lender" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Lender Portal</h2>
              <p className="text-purple-200">
                Create confidential lending offers and automatically match with qualified borrowers without seeing their
                sensitive data.
              </p>
            </div>

            <LenderDashboard />
          </div>
        )}

        {viewMode === "marketplace" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Lending Marketplace</h2>
              <p className="text-emerald-200">
                Browse active loan requests and lending offers. Use encrypted matching to connect borrowers with
                lenders.
              </p>
            </div>

            <MarketplaceMatching />
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Privacy First</h3>
            </div>
            <p className="text-xs text-slate-400">
              All data is encrypted using Zama's FHE technology. Your sensitive information never leaves your control.
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Smart Matching</h3>
            </div>
            <p className="text-xs text-slate-400">
              Automated encrypted matching ensures fair lending decisions without exposing personal details.
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Trustless</h3>
            </div>
            <p className="text-xs text-slate-400">
              All operations happen on-chain via smart contracts. No intermediaries or trusted third parties.
            </p>
          </div>
        </div>

        {/* Powered by Zama */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-full">
            <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-slate-300">
              Powered by <span className="font-semibold text-white">Zama FHEVM</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
