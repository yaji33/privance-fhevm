"use client";
import React from "react";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import ConnectWallet from "../WalletConnect";

export default function LenderPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [boxHeight, setBoxHeight] = useState<number | null>(null);

  const leftBoxRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (leftBoxRef.current) {
      // Set right box to match left box height
      setBoxHeight(leftBoxRef.current.clientHeight);
    }
  }, [isConnected]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const wallet = localStorage.getItem("walletConnected");
      if (wallet === "true") setIsConnected(true);
      setIsChecking(false);
    }
  }, []);

  const handleConnect = () => {
    localStorage.setItem("walletConnected", "true");
    setIsConnected(true);
  };

  if (isChecking) {
    return (
      <div className="h-screen bg-[#010510] flex items-center justify-center text-white">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen text-white bg-[#010510] overflow-hidden">
      {/* BACKGROUND */}
      {!isConnected ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[700px] h-[700px] rounded-full blur-[160px]"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.3), #17C71C 40%, rgba(0,0,0,1) 90%)",
            }}
          ></div>
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="w-[800px] h-[800px] rounded-full blur-[200px] absolute left-[-350px] top-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 40%, rgba(0,0,0,1) 90%)",
            }}
          ></div>
          <div
            className="w-[800px] h-[800px] rounded-full blur-[200px] absolute right-[-350px] top-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 40%, rgba(0,0,0,1) 90%)",
            }}
          ></div>
        </div>
      )}

      {/* CONTENT */}
      {!isConnected ? (
        // 🌙 Default: Connect wallet screen
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Lender</h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto mb-10">
            Fund loans based on encrypted risk assessments
          </p>

          <div className="bg-black/20 backdrop-blur-2xl border border-[#17C71C]/40 rounded-2xl shadow-[0_0_60px_rgba(23,199,28,0.3)] px-10 py-12 max-w-md mx-auto">
            <div className="flex flex-col items-center gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="#17C71C"
                className="w-16 h-16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2m3-4h-6m6 0l-2-2m2 2l-2 2"
                />
              </svg>

              <h2 className="text-white text-2xl font-semibold">
                Connect Your Wallet
              </h2>
              <p className="text-gray-300 mb-4 text-sm">
                MetaMask required for authentication
              </p>

              <div className="scale-90" onClick={handleConnect}>
                <ConnectWallet />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ✅ Connected: Two-column layout
        <div className="relative z-10 min-h-screen px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold text-center mb-4">Lender</h1>
            <p className="text-center text-gray-300 mb-6">
              Fund loans based on encrypted risk assessments.
            </p>

            <hr className="mx-auto w-1/2 border border-[#17C71C]/40 mb-10" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* LEFT COLUMN */}
              <div>
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Lending Preferences
                    </h2>
                    <p className="text-gray-300 text-md">
                      Set your encrypted lending criteria
                    </p>
                  </div>

                  <button className="bg-[#98E29D] text-black font-semibold px-6 py-3 rounded-lg hover:bg-green-300 transition">
                    Find Encrypted Matches
                  </button>
                </div>

                <div
                  ref={leftBoxRef}
                  className="bg-black/30 backdrop-blur-xl border border-[#17C71C]/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(23,199,28,0.2)]"
                >
                  <div className="space-y-6">
                  {/* Min Loan Amount */}
                  <div>
                    <label className="text-sm text-gray-200 block mb-2">
                      Min Loan Amount (USD)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-md bg-white/10 border border-[#17C71C]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#17C71C]"
                    />
                  </div>

                  {/* Max Loan Amount */}
                  <div>
                    <label className="text-sm text-gray-200 block mb-2">
                      Max Loan Amount (USD)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-md bg-white/10 border border-[#17C71C]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#17C71C]"
                    />
                  </div>

                  {/* Max Risk Level (Dropdown) */}
                  <div>
                    <label className="text-sm text-gray-200 block mb-2">
                      Max Risk Level
                    </label>
                    <div className="relative">
                      <select
                        className="appearance-none w-full p-2 rounded-md bg-white/10 border border-[#17C71C]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#17C71C] cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select Risk Level
                        </option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>

                      {/* Custom dropdown arrow */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#17C71C] pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Available Loan Requests
                </h2>
                <p className="text-gray-300 mb-10">
                  Smart contracts computed these matches from encrypted data
                </p>

                <div
                  className="bg-black/30 backdrop-blur-xl border border-[#17C71C]/30 rounded-2xl p-6 mb-4 shadow-[0_0_40px_rgba(23,199,28,0.2)] space-y-4 overflow-y-auto custom-scroll"
                  style={{ height: boxHeight ? `${boxHeight}px` : "auto" }}
                >
                  {[
                    {
                      amount: "$10,000",
                      risk: "Low Risk",
                      purpose: "Business Expansion",
                      rate: "5.5%",
                      term: "12 months",
                      return: "$550",
                    },
                    {
                      amount: "$5,000",
                      risk: "Low Risk",
                      purpose: "Education",
                      rate: "4.8%",
                      term: "24 months",
                      return: "$480",
                    },
                    {
                      amount: "$8,000",
                      risk: "Medium Risk",
                      purpose: "Startup Capital",
                      rate: "6.2%",
                      term: "18 months",
                      return: "$744",
                    },
                    {
                      amount: "$12,500",
                      risk: "Low Risk",
                      purpose: "Green Energy Project",
                      rate: "5.0%",
                      term: "24 months",
                      return: "$1,250",
                    },
                    {
                      amount: "$7,200",
                      risk: "Medium Risk",
                      purpose: "Medical Expenses",
                      rate: "6.0%",
                      term: "12 months",
                      return: "$432",
                    },
                  ].map((loan, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col bg-white/5 border border-[#17C71C]/30 rounded-xl p-5 hover:bg-white/10 transition"
                    >
                      {/* Button — top right */}
                      <button className="absolute top-4 right-4 bg-[#98E29D] text-black font-semibold px-4 py-2 rounded-lg hover:bg-green-300 transition">
                        Fund Loan
                      </button>

                      {/* Card Content */}
                      <div className="pr-25"> {/* space so button doesn't overlap text */}
                       <h3 className="text-2xl font-semibold text-[#98E29D]">
                          {loan.amount}{" "}
                          <span
                            className={`ml-2 mb-5 text-xs font-medium px-3 py-1 rounded-full
                              ${
                                loan.risk === "Low Risk"
                                  ? "bg-green-100 text-green-800"
                                  : loan.risk === "Medium Risk"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {loan.risk}
                          </span>
                        </h3>
                        <p className="text-gray-200 mt-1">{loan.purpose}</p>
                        <p className="text-sm text-gray-300 mt-1">
                          <span className="font-semibold">Interest Rate:</span> {loan.rate} •{" "}
                          <span className="font-semibold">Term:</span> {loan.term} •{" "}
                          <span className="font-semibold">Expected Return:</span> {loan.return}
                        </p>
                      </div>
                    </div>

                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
