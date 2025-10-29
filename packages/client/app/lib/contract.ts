import contractABI from "../../../smart-contracts/artifacts/contracts/ConfidentialCreditScore.sol/ConfidentialCreditScoreMock.json";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const SEPOLIA_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID as string;

export const getContract = async (): Promise<ethers.Contract> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  // Check if connected to Sepolia
  if (network.chainId !== BigInt(SEPOLIA_CHAIN_ID)) {
    throw new Error(`Wrong network! Please switch to Sepolia testnet. Currently on chain ID: ${network.chainId}`);
  }

  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
};

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
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
      throw error;
    }
  }
};

// Helper to check current network
export const checkNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  return network.chainId === BigInt(SEPOLIA_CHAIN_ID);
};
