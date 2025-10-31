"use client";

import React, { useState } from "react";
import LenderDashboard from "../_components/LenderDashboard";
import RepaymentTracker from "../_components/RepaymentTracker";
import WalletAuthGuard from "../_components/WalletGuard";

export default function Lender() {
  const [lenderTab, setLenderTab] = useState<"offers" | "repayment">("offers");

  return (
    <WalletAuthGuard
      title="Lender Portal"
      description="Create confidential lending offers and automatically match with qualified borrowers based on encrypted credit scores."
      requireConnection={true}
    >
      <div className="w-full min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className=" bg-slate-800/50 border  shadow-xl  border-white/10 w-full mt-24">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-b border-slate-700">
              <button
                onClick={() => setLenderTab("offers")}
                className={`px-3 sm:px-4 py-2  font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  lenderTab === "offers"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Create Offers
              </button>

              <button
                onClick={() => setLenderTab("repayment")}
                className={`px-3 sm:px-4 py-2 font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  lenderTab === "repayment"
                    ? "bg-slate-700/50 text-white border border-slate-600"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                Track Repayments
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {lenderTab === "offers" && <LenderDashboard />}
              {lenderTab === "repayment" && <RepaymentTracker />}
            </div>
          </div>
        </div>
      </div>
    </WalletAuthGuard>
  );
}
