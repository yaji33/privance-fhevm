"use client";
import { useState } from "react";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask not detected!");
      return;
    }

    if (!window.ethereum.isMetaMask) {
      alert("Please use MetaMask to connect.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      // Check Sepolia (chainId: 11155111)
      if (network.chainId !== BigInt(11155111)) {
        const switchNetwork = confirm(
          "You're on the wrong network. Switch to Sepolia testnet?"
        );

        if (switchNetwork) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xaa36a7" }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Add Sepolia if not added
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xaa36a7",
                    chainName: "Sepolia Testnet",
                    nativeCurrency: {
                      name: "SepoliaETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://rpc.sepolia.org"],
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        } else {
          setIsConnecting(false);
          return;
        }
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      {account ? (
        <p className="text-sm text-green-400 truncate max-w-[200px]">
          {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-4 py-2 bg-[#98E29D] hover:bg-green-500 text-black font-medium rounded-lg transition-all shadow-sm hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
