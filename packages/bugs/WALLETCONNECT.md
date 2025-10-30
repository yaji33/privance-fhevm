# Wallet Connection Bug & Fix

## Issue

When connecting via MetaMask popup or Phantom/MetaMask (collaborated) instead of the RainbowKit modal:
- The app gets stuck on “Initializing encryption…” (both in the Form and CreditScoreDisplay components).
- In some cases, the form submits but the encryption initialization hangs afterward, preventing score display.
- If the score appears, it’s incorrect (repayment component only) — e.g., always returning 500n.

## Root Cause

The wallet session was initialized outside the RainbowKit/Wagmi context, which caused:
- Inconsistent provider injection between window.ethereum and Wagmi’s provider.
- Failure in FHE initialization and encryption handling.
- Contract interactions defaulting to a disconnected signer context.

## Solution

Ensure users connect their wallet through RainbowKit’s built-in connection modal, not through MetaMask directly.

Correct way:
Use the RainbowKit ConnectButton (e.g., WalletConnect, MetaMask via RainbowKit).
Incorrect way:
Connecting via MetaMask’s popup without RainbowKit involvement.

## Requirements

The wallet must be connected through @rainbow-me/rainbowkit.

Ensure the network is set to Sepolia Testnet before form submission.
RainbowKit will automatically prompt users to switch if needed.

## Additional Note

If multiple wallet extensions are active (e.g., Phantom) in Chrome:

RainbowKit may fail to detect the Sepolia Testnet or default to the wrong provider.

This causes encryption initialization to fail silently.

Workaround:
Temporarily disable other wallet extensions (e.g., Phantom) in your browser when testing or submitting forms with MetaMask.