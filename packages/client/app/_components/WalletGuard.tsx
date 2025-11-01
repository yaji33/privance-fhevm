"use client";

import { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

interface WalletAuthGuardProps {
  children: ReactNode;
  title: string;
  description: string;
  requireConnection?: boolean;
}

export default function WalletAuthGuard({
  children,
  title,
  description,
  requireConnection = true,
}: WalletAuthGuardProps) {
  const { address, isConnected } = useAccount();

  const isAuthed = !requireConnection || (isConnected && address);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden ">
      {!isAuthed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden ">
          <div
            className="h-[1000px] w-[1000px]  blur-[210px]"
            style={{
              background:
                "radial-gradient(circle at center, rgba(23,199,28,0.4), rgba(23,199,28,0.2) 20%, transparent 80%)",
            }}
          ></div>
        </div>
      )}

      {isAuthed && <div className="absolute inset-0 bg-black"></div>}

      <div className="relative z-10 w-full max-w-7xl sm:max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-x-hidden">
        {!isAuthed ? (
          <div className="max-w-2xl mx-auto gap-4 flex flex-col pt-24">
            <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
            <p className="text-gray-300 text-lg mb-10">{description}</p>

            <div className="bg-[#0f1f0e]/60 backdrop-blur-2xl border border-[#17C71C]/40   px-10 py-4 max-w-md mx-auto">
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-white text-2xl font-semibold">Connect Your Wallet</h2>
                <p className="text-gray-300 mb-4 text-sm">Wallet connection required for encrypted credit scoring</p>

                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => {
                    const ready = mounted;

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
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="bg-[#98E29D] text-gray-900 px-8 py-3  text-base font-semibold hover:bg-green-300 transition shadow-lg hover:shadow-green-500/30"
                        >
                          Connect Wallet
                        </button>
                      </div>
                    );
                  }}
                </ConnectButton.Custom>

                <div className="mt-4 p-3 bg-[#0a1a0a]/50  border border-[#17C71C]/30 w-full">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[#98E29D] flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="space-y-1 text-left">
                      <p className="text-xs text-gray-300">
                        Make sure you're connected to{" "}
                        <span className="text-[#98E29D] font-medium">Sepolia Testnet</span>
                      </p>
                      <p className="text-xs text-gray-400">RainbowKit will prompt you to switch networks if needed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
}
