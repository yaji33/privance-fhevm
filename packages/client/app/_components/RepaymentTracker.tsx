"use client";

import React, { useEffect, useState } from "react";
import { getAgreementDetails, getBorrowerAgreements, getLenderAgreements, makePayment } from "../lib/contract";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

interface RepaymentAgreement {
  agreementId: number;
  loanId: number;
  offerId: number;
  borrower: string;
  lender: string;
  principal: string;
  interestRate: string;
  totalRepaymentAmount: string;
  amountRepaid: string;
  dueDate: number;
  status: string;
  monthlyPayment?: string;
}

export default function RepaymentTracker() {
  const { address } = useAccount();
  const [agreements, setAgreements] = useState<RepaymentAgreement[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRepaymentData = async () => {
    if (!address) return;

    setRefreshing(true);
    try {
      console.log("Loading repayment agreements for:", address);

      // Get both borrower and lender agreements
      const [borrowerAgreementIds, lenderAgreementIds] = await Promise.all([
        getBorrowerAgreements(address),
        getLenderAgreements(address),
      ]);

      console.log("Borrower agreements:", borrowerAgreementIds);
      console.log("Lender agreements:", lenderAgreementIds);

      const allAgreementIds = [...new Set([...borrowerAgreementIds, ...lenderAgreementIds])];
      console.log("All agreement IDs:", allAgreementIds);

      const agreementDetails = await Promise.all(
        allAgreementIds.map(async (agreementId: bigint) => {
          try {
            const details = await getAgreementDetails(agreementId);
            console.log(`Agreement ${agreementId} details:`, details);

            // Parse the agreement details
            const [borrower, lender, principal, interestRate, totalRepayment, amountRepaid, dueDate, isActive] =
              details;

            // Determine status based on contract data
            let status = "UNKNOWN";
            if (!isActive) {
              status = "CLOSED";
            } else if (Number(amountRepaid) >= Number(totalRepayment)) {
              status = "REPAID";
            } else if (Date.now() > Number(dueDate) * 1000) {
              status = "OVERDUE";
            } else {
              status = "ACTIVE";
            }

            return {
              agreementId: Number(agreementId),
              loanId: Number(agreementId),
              offerId: Number(agreementId),
              borrower,
              lender,
              principal: ethers.formatEther(principal),
              interestRate: ethers.formatUnits(interestRate, 2),
              totalRepaymentAmount: ethers.formatEther(totalRepayment),
              amountRepaid: ethers.formatEther(amountRepaid),
              dueDate: Number(dueDate),
              status,
            };
          } catch (error) {
            console.error(`Error loading agreement ${agreementId}:`, error);
            return null;
          }
        }),
      );

      const validAgreements = agreementDetails.filter(Boolean) as RepaymentAgreement[];
      console.log("Loaded agreements:", validAgreements);
      setAgreements(validAgreements);
    } catch (error) {
      console.error("Error loading repayment data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMakePayment = async (agreementId: number) => {
    if (!address || !paymentAmounts[agreementId]) return;

    setLoading(true);
    try {
      console.log(`Making payment for agreement ${agreementId}:`, paymentAmounts[agreementId]);

      const tx = await makePayment(agreementId, paymentAmounts[agreementId]);
      console.log("Payment transaction:", tx);

      await tx.wait();

      // Clear payment amount and refresh data
      setPaymentAmounts(prev => ({ ...prev, [agreementId]: "" }));
      await loadRepaymentData();

      alert("Payment made successfully!");
    } catch (error: any) {
      console.error("Error making payment:", error);
      alert(`Payment failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-600/20 border-green-500/30 text-green-400";
      case "overdue":
        return "bg-yellow-600/20 border-yellow-500/30 text-yellow-400";
      case "defaulted":
        return "bg-red-600/20 border-red-500/30 text-red-400";
      case "repaid":
        return "bg-blue-600/20 border-blue-500/30 text-blue-400";
      case "closed":
        return "bg-slate-600/20 border-slate-500/30 text-slate-400";
      default:
        return "bg-slate-600/20 border-slate-500/30 text-slate-400";
    }
  };

  const getRoleBadge = (agreement: RepaymentAgreement) => {
    if (address?.toLowerCase() === agreement.borrower.toLowerCase()) {
      return "bg-blue-600/20 border-blue-500/30 text-blue-400";
    } else if (address?.toLowerCase() === agreement.lender.toLowerCase()) {
      return "bg-purple-600/20 border-purple-500/30 text-purple-400";
    }
    return "bg-slate-600/20 border-slate-500/30 text-slate-400";
  };

  useEffect(() => {
    loadRepaymentData();
  }, [address]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700  p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Loan Repayments</h3>
        <button
          onClick={loadRepaymentData}
          disabled={refreshing}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800  text-white text-sm transition"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {agreements.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-500 text-sm">No active repayment agreements</p>
          <p className="text-slate-600 text-xs mt-1">Your funded loan repayments will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map(agreement => (
            <div key={agreement.agreementId} className="bg-slate-900/50 border border-slate-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-300">Agreement #{agreement.agreementId}</span>
                    <span className={`px-2 py-1  text-xs font-medium ${getStatusColor(agreement.status)}`}>
                      {agreement.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium ${getRoleBadge(agreement)}`}>
                      {address?.toLowerCase() === agreement.borrower.toLowerCase() ? "Borrower" : "Lender"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Principal</p>
                      <p className="text-white font-semibold">Ξ {agreement.principal}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Interest Rate</p>
                      <p className="text-white font-semibold">{agreement.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Total Due</p>
                      <p className="text-white font-semibold">Ξ {agreement.totalRepaymentAmount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Paid</p>
                      <p className="text-white font-semibold">Ξ {agreement.amountRepaid}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Due: {new Date(agreement.dueDate * 1000).toLocaleDateString()}</span>
                    <span>
                      Borrower: {agreement.borrower.slice(0, 6)}...{agreement.borrower.slice(-4)}
                    </span>
                    <span>
                      Lender: {agreement.lender.slice(0, 6)}...{agreement.lender.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Only show for ACTIVE agreements where user is borrower */}
              {agreement.borrower.toLowerCase() === address?.toLowerCase() && agreement.status === "ACTIVE" && (
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="Payment amount (ETH)"
                      value={paymentAmounts[agreement.agreementId] || ""}
                      onChange={e =>
                        setPaymentAmounts(prev => ({
                          ...prev,
                          [agreement.agreementId]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600  text-white text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleMakePayment(agreement.agreementId)}
                      disabled={loading || !paymentAmounts[agreement.agreementId]}
                      className="px-4 py-2 bg-[#98E29D] text-gray-900 hover:bg-emerald-700 disabled:bg-slate-600  text-sm font-medium transition whitespace-nowrap"
                    >
                      {loading ? "Paying..." : "Make Payment"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Remaining: Ξ{" "}
                    {(parseFloat(agreement.totalRepaymentAmount) - parseFloat(agreement.amountRepaid)).toFixed(6)} ETH
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
