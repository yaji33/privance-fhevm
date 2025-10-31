"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Wallet Connection</h2>
        <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}></div>
      </div>

      {isConnected && address ? (
        <div className="space-y-4">
          <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Connected Address</p>
            <p className="text-sm text-emerald-400 font-mono break-all">{address}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Wallet connected successfully</span>
          </div>

          <div className="flex justify-center pt-2">
            <ConnectButton.Custom>
              {({ openAccountModal }) => (
                <button
                  onClick={openAccountModal}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white text-sm font-medium transition-all duration-200 border border-slate-600"
                >
                  Manage Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm text-center mb-4">
            Connect your wallet to access encrypted credit scoring
          </p>

          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="bg-[#98E29D] text-gray-900 px-5 py-2 rounded-md text-sm font-semibold hover:bg-green-300 transition shadow-sm hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect Wallet
                        </button>
                      );
                    }
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  Make sure you're connected to <span className="text-indigo-400 font-medium">Sepolia Testnet</span>
                </p>
                <p className="text-xs text-slate-500">RainbowKit will prompt you to switch networks if needed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
