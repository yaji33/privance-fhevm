"use client";
import { useState, useEffect } from "react";
import ConnectWallet from "../WalletConnect";

export default function Borrow() {
  const [isConnected, setIsConnected] = useState(false);

  // 🔹 Check wallet connection on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wallet = localStorage.getItem("walletConnected");
      if (wallet === "true") setIsConnected(true);
    }
  }, []);

  const handleConnect = () => {
    localStorage.setItem("walletConnected", "true");
    setIsConnected(true);
  };

  return (
    <div className="relative h-screen text-white bg-[#010510] overflow-hidden">
      {/* ================== BACKGROUND ================== */}
      {!isConnected ? (
        // 🔵 Default background (center glowing circle)
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
        // 🟢 Connected background (dual side gradients)
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left gradient */}
          <div
            className="w-[800px] h-[800px] rounded-full blur-[200px] absolute left-[-350px] top-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 40%, rgba(0,0,0,1) 90%)",
            }}
          ></div>

          {/* Right gradient */}
          <div
            className="w-[800px] h-[800px] rounded-full blur-[200px] absolute right-[-350px] top-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 40%, rgba(0,0,0,1) 90%)",
            }}
          ></div>
        </div>
      )}

      {/* ================== CONTENT ================== */}
      {!isConnected ? (
        // 🌙 Default screen (connect wallet)
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Borrower</h1>
          <p className="text-gray-300 text-lg max-w-md mx-auto mb-10">
            Encrypt your credit data and request loans with complete privacy.
          </p>

          {/* Glassmorphism Card */}
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
        // 🟩 Connected screen (borrow content)
        <div className="relative z-10 min-h-screen px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-5xl font-bold text-center mb-4">Borrower</h1>
            <p className="text-center text-gray-300 mb-6">
              Encrypt your credit data and request loans with complete privacy.
            </p>

            <hr className="mx-auto w-1/2 border border-[#17C71C]/40 mb-10" />

            {/* Title + Button */}
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Encrypt Credit Data</h2>
                <p className="text-gray-300 text-md">
                  Your data is encrypted locally using Zama's FHE SDK.
                </p>
              </div>

              <button className="bg-[#98E29D] text-black font-semibold px-6 py-3 rounded-lg hover:bg-green-300 transition">
                Encrypt Data & Compute Score
              </button>
            </div>

            {/* Form */}
            <div className="bg-black/30 backdrop-blur-xl border border-[#17C71C]/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(23,199,28,0.2)]">
              <div className="space-y-6">
                {[
                  "Annual Income (USD)",
                  "Repayment History Score (0-100)",
                  "Total Liabilities (USD)",
                ].map((label, i) => (
                  <div key={i}>
                    <label className="text-sm text-gray-200 block mb-2">
                      {label}
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 rounded-md bg-white/10 border border-[#17C71C]/40 text-white focus:outline-none focus:ring-2 focus:ring-[#17C71C]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
