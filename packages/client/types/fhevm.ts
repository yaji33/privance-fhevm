import type { DecryptedResults, HandleContractPair } from "@zama-fhe/relayer-sdk/bundle";


export type FhevmUserDecryptInput = {
  handles: HandleContractPair[]; // Array of encrypted handles with their contracts
  privateKey: string; // User’s private key (from generateKeypair)
  publicKey: string; // User’s public key (from generateKeypair)
  signature: string; // Signature for verification
  contractAddresses: `0x${string}`[]; // List of contracts authorized for decryption
  userAddress: `0x${string}`; // EOA performing decryption
  startTimestamp: number | string; // Unix timestamp when permission starts
  durationDays: number | string; // Duration in days
};

export type { DecryptedResults };
