import type { FhevmUserDecryptInput } from "../types/fhevm";
import type { DecryptedResults, FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

export async function userDecryptWrapper(
  fhevmInstance: FhevmInstance,
  input: FhevmUserDecryptInput,
): Promise<DecryptedResults> {
  const { handles, privateKey, publicKey, signature, contractAddresses, userAddress, startTimestamp, durationDays } =
    input;

  return fhevmInstance.userDecrypt(
    handles,
    privateKey,
    publicKey,
    signature,
    contractAddresses,
    userAddress,
    startTimestamp,
    durationDays,
  );
}
