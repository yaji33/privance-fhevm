"use client";

import React, { useState } from "react";
import BorrowerForm from "../_components/BorrowerForm";
import BorrowerLoanRequest from "../_components/BorrowerLoanRequest";
import CollateralManager from "../_components/CollateralManager";
import CreditScoreDisplay from "../_components/CreditScoreDisplay";
import RepaymentTracker from "../_components/RepaymentTracker";
import WalletAuthGuard from "../_components/WalletGuard";

export default function Borrow() {
  const [borrowerTab, setBorrowerTab] = useState<"profile" | "collateral" | "loans" | "repayment">("profile");

  return (
    <WalletAuthGuard
      title="Borrower Portal"
      description="Submit your financial data confidentially and get matched with lenders based on your encrypted credit score."
      requireConnection={true}
    >
      <div className="w-full min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className=" bg-slate-800/50 border  shadow-xl  border-white/10 w-full mt-24">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-b border-slate-700">
              <button
                onClick={() => setBorrowerTab("profile")}
                className={`px-3 py-2 font-medium transition text-sm whitespace-nowrap ${
                  borrowerTab === "profile"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <span className="hidden sm:inline"> Profile & Credit</span>
                <span className="sm:hidden"> Profile</span>
              </button>
              <button
                onClick={() => setBorrowerTab("collateral")}
                className={`px-3 sm:px-4 py-2  font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  borrowerTab === "collateral"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Collateral
              </button>
              <button
                onClick={() => setBorrowerTab("loans")}
                className={`px-3 sm:px-4 py-2  font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  borrowerTab === "loans"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <span className="hidden sm:inline"> Loan Requests</span>
                <span className="sm:hidden"> Loans</span>
              </button>
              <button
                onClick={() => setBorrowerTab("repayment")}
                className={`px-3 sm:px-4 py-2  font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  borrowerTab === "repayment"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Repayments
              </button>
            </div>

            <div className="p-4">
              {borrowerTab === "profile" && (
                <div className="space-y-6">
                  <CreditScoreDisplay />
                  <BorrowerForm />
                </div>
              )}
              {borrowerTab === "collateral" && <CollateralManager />}
              {borrowerTab === "loans" && <BorrowerLoanRequest />}
              {borrowerTab === "repayment" && <RepaymentTracker />}
            </div>
          </div>
        </div>
      </div>
    </WalletAuthGuard>
  );
}
