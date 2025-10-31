import { useEffect, useState } from "react";
import { getContract as getContractInstance } from "../../app/lib/contract";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const initContract = async () => {
      if (isConnected && address) {
        try {
          const contractInstance = await getContractInstance();
          setContract(contractInstance);
        } catch (error) {
          console.error("Failed to initialize contract:", error);
        }
      }
      setLoading(false);
    };

    initContract();
  }, [isConnected, address]);

  return { contract, loading };
}
