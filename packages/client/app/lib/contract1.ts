import contractABI from "../../../smart-contracts/artifacts/contracts/LendingMarketplace.sol/LendingMarketplace.json";
import type { FhevmInstance } from "@fhevm-sdk";
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

export const encryptData = async (fhevmInstance: FhevmInstance, value: bigint, signerAddress: string) => {
  if (!fhevmInstance) {
    throw new Error("FHEVM instance not initialized");
  }

  // Validate input
  if (value < 0n) {
    throw new Error("Value cannot be negative");
  }

  // Create encrypted input for the contract
  const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, signerAddress);
  input.add64(value);
  return input.encrypt();
};

export const getSignerAddress = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer.address;
};

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID,
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


export const checkNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  return network.chainId === BigInt(SEPOLIA_CHAIN_ID);
};


export const submitBorrowerData = async (
  fhevmInstance: FhevmInstance,
  income: bigint,
  repaymentScore: bigint,
  liabilities: bigint,
  signerAddress: string,
) => {
  const contract = await getContract();

  const incomeEnc = await encryptData(fhevmInstance, income, signerAddress);
  const repaymentEnc = await encryptData(fhevmInstance, repaymentScore, signerAddress);
  const liabilitiesEnc = await encryptData(fhevmInstance, liabilities, signerAddress);

  const toHex = (bytes: Uint8Array) =>
    "0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  return contract.submitBorrowerData(
    incomeEnc.handles[0],
    toHex(incomeEnc.inputProof),
    repaymentEnc.handles[0],
    toHex(repaymentEnc.inputProof),
    liabilitiesEnc.handles[0],
    toHex(liabilitiesEnc.inputProof),
    { gasLimit: 5000000 },
  );
};


export const computeCreditScore = async () => {
  const contract = await getContract();
  return contract.computeCreditScore({ gasLimit: 5000000 });
};


export const createLoanRequest = async (
  fhevmInstance: FhevmInstance,
  amount: bigint,
  duration: bigint,
  signerAddress: string,
) => {
  const contract = await getContract();

  const amountEnc = await encryptData(fhevmInstance, amount, signerAddress);
  const durationEnc = await encryptData(fhevmInstance, duration, signerAddress);

  const toHex = (bytes: Uint8Array) =>
    "0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  return contract.createLoanRequest(
    amountEnc.handles[0],
    toHex(amountEnc.inputProof),
    durationEnc.handles[0],
    toHex(durationEnc.inputProof),
    { gasLimit: 5000000 },
  );
};

export const createLenderOffer = async (
  fhevmInstance: FhevmInstance,
  minCreditScore: bigint,
  maxLoanAmount: bigint,
  interestRate: bigint,
  fundingAmountEth: string,
  signerAddress: string,
) => {
  const contract = await getContract();

  const minScoreEnc = await encryptData(fhevmInstance, minCreditScore, signerAddress);
  const maxAmountEnc = await encryptData(fhevmInstance, maxLoanAmount, signerAddress);
  const interestEnc = await encryptData(fhevmInstance, interestRate, signerAddress);

  const toHex = (bytes: Uint8Array) =>
    "0x" +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  return contract.createLenderOffer(
    minScoreEnc.handles[0],
    toHex(minScoreEnc.inputProof),
    maxAmountEnc.handles[0],
    toHex(maxAmountEnc.inputProof),
    interestEnc.handles[0],
    toHex(interestEnc.inputProof),
    {
      value: ethers.parseEther(fundingAmountEth),
      gasLimit: 5000000,
    },
  );
};


export const checkLoanMatch = async (loanId: number, offerId: number) => {
  const contract = await getContract();
  return contract.checkLoanMatch(loanId, offerId, { gasLimit: 5000000 });
};


export const fundLoan = async (loanId: number, offerId: number) => {
  const contract = await getContract();
  return contract.fundLoan(loanId, offerId, { gasLimit: 5000000 });
};


export const getLoanRequest = async (loanId: number) => {
  const contract = await getContract();
  return contract.getLoanRequest(loanId);
};


export const getLenderOffer = async (offerId: number) => {
  const contract = await getContract();
  return contract.getLenderOffer(offerId);
};


export const hasSubmittedData = async () => {
  const contract = await getContract();
  return contract.hasSubmittedData();
};


export const hasCreditScore = async () => {
  const contract = await getContract();
  return contract.hasCreditScore();
};


export const getCreditScore = async () => {
  const contract = await getContract();
  return contract.getCreditScore();
};
