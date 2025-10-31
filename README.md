<p align="center">
  <img src="https://github.com/user-attachments/assets/908f1cfd-7eb7-405c-8abf-264c029db210" alt="Privance Logo" width="400"/>
</p>

# Privance: Privacy-First DeFi Lending

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://privance.vercel.app/home)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A decentralized lending marketplace built on Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM), enabling credit scoring and loan matching on encrypted data without ever exposing sensitive financial information.

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Smart Contract Design](#smart-contract-design)
- [Usage Guide](#usage-guide)
- [Security Considerations](#security-considerations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

Privance is a privacy-preserving lending protocol that solves a fundamental problem in DeFi: **how to assess creditworthiness without compromising user privacy**. Built on Zama's FHEVM, Privance performs all credit scoring computations directly on encrypted data, ensuring that:

- Borrowers never expose their financial history
- Lenders can assess risk objectively
- All operations are verifiable on-chain
- Compliance with data protection regulations (GDPR, PDPA) is built-in

**Live Demo**: [https://privance.vercel.app/home](https://privance.vercel.app/home)  
**Repository**: [https://github.com/yaji33/privance-fhevm](https://github.com/yaji33/privance-fhevm)

## The Problem

Traditional DeFi lending faces a dilemma:

1. **Transparency vs. Privacy**: Public blockchains expose all transaction data, making financial privacy impossible
2. **Trust Requirements**: Off-chain credit scoring requires trusting third parties with sensitive data
3. **Regulatory Risk**: Storing unencrypted personal financial data creates compliance issues
4. **Bias & Discrimination**: Public wallet histories can lead to biased lending decisions

## The Solution

Privance uses **Fully Homomorphic Encryption (FHE)** to compute credit scores and match lenders with borrowers—all while keeping the underlying data encrypted at every step:

```
Input Data (Plaintext) → FHE Encryption → Encrypted Computation → Encrypted Result → Decryption (only by owner)
```

This means:
- **No decryption during computation**: The smart contract never sees your actual numbers
- **Mathematical guarantees**: Cryptography ensures privacy, not just access control
- **On-chain verification**: All computations are transparent and auditable, even though the data isn't

## How It Works

### For Borrowers

1. **Encrypt Financial Data**: Income, liabilities, and repayment history are encrypted client-side using Zama's FHE SDK
2. **Submit to Blockchain**: Encrypted data is stored on-chain as ciphertext
3. **Compute Credit Score**: Smart contracts calculate your score using FHE operations on encrypted values
4. **Decrypt Privately**: Only you can decrypt your credit score using your private key
5. **Request Loans**: Submit encrypted loan requests that lenders can evaluate without seeing your details

### For Lenders

1. **Set Criteria**: Define minimum credit scores, maximum loan amounts, and interest rates (all encrypted)
2. **Fund Offers**: Deposit collateral into smart contracts
3. **Automated Matching**: The protocol matches you with compatible borrowers using encrypted comparison operations
4. **Risk Assessment**: See risk classifications (Low/Medium/High) without accessing raw borrower data
5. **Execute Loans**: Fund approved loans directly through smart contracts

### The Magic: FHE in Action

Traditional encryption:
```
Encrypt(5) + Encrypt(3) = ??? → Must decrypt first → 5 + 3 = 8 → Encrypt(8)
```

Fully Homomorphic Encryption:
```
Encrypt(5) + Encrypt(3) = Encrypt(8) → No decryption needed!
```

This property allows Privance to perform complex credit scoring formulas on encrypted inputs, producing encrypted outputs that only the borrower can decrypt.

## Key Features

### Privacy-First Design
- **End-to-end encryption**: Data is encrypted before leaving your browser
- **No trusted intermediaries**: All computations happen on-chain
- **Selective disclosure**: Choose what to reveal and to whom

### Credit Scoring
- **Encrypted inputs**: Income, liabilities, repayment history
- **On-chain computation**: Smart contract calculates scores using FHE arithmetic
- **Private results**: Only the borrower sees their actual score

### Secure Matching
- **Encrypted criteria**: Lender preferences remain confidential
- **Homomorphic comparison**: Match borrowers and lenders without exposing data
- **Fair evaluation**: Decisions based on encrypted metrics, not identities

### Collateral Management
- **Encrypted collateral**: Deposit amounts remain private
- **Automated liquidation**: Triggered by encrypted threshold checks
- **Transparent repayments**: Track payment progress without revealing amounts

## Context-Level DFD

<img width="3306" height="1601" alt="Blank diagram - Page 1 (9)" src="https://github.com/user-attachments/assets/3c0aec38-40cb-4a39-8e77-0b60384a42fd" />


## Use Case Diagram

<img width="3418" height="2631" alt="Blank diagram - Page 1 (10)" src="https://github.com/user-attachments/assets/86caf718-99ce-4c62-80a6-a21590ea8bf0" />


## Architecture

<img width="2291" height="2891" alt="Blank diagram - Page 1 (11)" src="https://github.com/user-attachments/assets/c4a77994-05da-43e8-896e-23126f5f659e" />


## Technology Stack

### Blockchain
- **Zama FHEVM**: Blockchain that supports encrypted smart contract computations
- **Sepolia Testnet**: Ethereum test network for contract deployment
- **Solidity**: Smart contract language with FHE type extensions

### Frontend
- **Next.js**: UI framework
- **TailwindCSS**: Styling framework
- **MetaMask with RainbowKit**: Wallet integration

### Encryption
- **Zama FHE SDK**: Client-side encryption/decryption library
- **euint256**: Encrypted unsigned integer type (256-bit)
- **ebool**: Encrypted boolean type

### Deployment
- **Vercel**: Frontend hosting
- **ETH Sepolia**: Smart contract deployment

## Getting Started

### Prerequisites

```bash
Node.js >= 22.x
npm or pnpm or yarn 

MetaMask browser extension
Alchemy account (for Sepolia RPC access)
```

### Project Structure

```
privance-fhevm/
├── packages/
│   ├── client/              # Frontend application (Next.js)
│   └── smart-contracts/     # Smart contracts (Hardhat)
├── node_modules/
└── package.json
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yaji33/privance-fhevm.git
cd privance-fhevm
```

2. **Install dependencies**
```bash
npm install
```

### Smart Contract Setup

1. **Navigate to smart contracts package**
```bash
cd packages/smart-contracts
```

2. **Create environment file**
```bash
cp .env.example .env
```

3. **Configure smart contract environment variables**

Edit `packages/smart-contracts/.env`:
```bash
ALCHEMY_API_KEY=your_alchemy_api_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key
SEPOLIA_PRIVATE_KEY=your_wallet_private_key
```

**How to get these values:**
- **ALCHEMY_API_KEY**: Create a free account at [Alchemy](https://www.alchemy.com/), create a new app on Sepolia network
- **SEPOLIA_RPC_URL**: Copy the HTTP endpoint from your Alchemy app dashboard
- **SEPOLIA_PRIVATE_KEY**: Export from MetaMask (Account Details → Export Private Key)
  - ⚠️ **Never share or commit this key!**

4. **Compile contracts**
```bash
npx hardhat compile
```

5. **Deploy to Sepolia testnet**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Note: Ensure you have Sepolia ETH for gas fees. Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

6. **Save deployed contract addresses**

After deployment, you'll see output like:
```
LendingMarketPlace deployed to: 0x123...
CollateralManager deployed to: 0x456...
RepaymentTracker deployed to: 0x789...
```

Copy these addresses for the frontend configuration.

### Frontend Setup

1. **Navigate to client package**
```bash
cd packages/client
```

2. **Create environment file**
```bash
cp .env.example .env.local
```

3. **Configure frontend environment variables**

Edit `packages/client/.env.local`:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x123...        # LendingMarketPlace address
NEXT_PUBLIC_COLLATERAL_MANAGER=0x456...      # CollateralManager address
NEXT_PUBLIC_REPAYMENT_TRACKER=0x789...       # RepaymentTracker address
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_CHAIN_ID=11155111                # Sepolia chain ID
```

4. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Smart Contract Design

### Core Contracts

The Privance platform consists of three main smart contracts:

#### 1. LendingMarketPlace.sol

The main contract that manages loan requests, lender offers, and matching logic.

```solidity
// Simplified pseudocode
function computeCreditScore(
    euint256 encryptedIncome,
    euint256 encryptedLiabilities,
    euint256 encryptedRepaymentScore
) public returns (euint256) {
    // All operations on encrypted values
    euint256 debtToIncome = TFHE.div(encryptedLiabilities, encryptedIncome);
    euint256 baseScore = TFHE.mul(encryptedRepaymentScore, 10);
    euint256 finalScore = TFHE.sub(baseScore, debtToIncome);
    
    return finalScore; // Result is still encrypted
}
```

**Key Features**:
- Accepts only encrypted inputs (euint256 type)
- Performs arithmetic operations using TFHE library
- Returns encrypted results
- Only data owner can decrypt the score
- Handles loan request creation and matching

#### 2. CollateralManager.sol

Manages encrypted collateral deposits and tracking.

```solidity
struct Collateral {
    address borrower;
    euint256 encryptedAmount;
    bool isLocked;
}
```

**Key Features**:
- Stores collateral amounts as encrypted values
- Tracks locked/unlocked status
- Enables privacy-preserving collateral management

#### 3. RepaymentTracker.sol

Tracks loan repayments with encrypted amounts.

```solidity
struct Repayment {
    address borrower;
    uint256 loanId;
    euint256 encryptedAmountPaid;
    uint256 timestamp;
}
```

**Key Features**:
- Records repayments with encrypted amounts
- Maintains payment history privately
- Calculates remaining balances on encrypted values

### FHE Operations Used

The contract leverages Zama's TFHE library for encrypted computations:

| Operation | TFHE Function | Usage in Privance |
|-----------|---------------|-------------------|
| Import External | `FHE.fromExternal()` | Convert client-encrypted data to contract format |
| Addition | `FHE.add(a, b)` | Calculate credit score components |
| Subtraction | `FHE.sub(a, b)` | Compute differences in debt ratios |
| Multiplication | `FHE.mul(a, b)` | Scale values for debt-to-income calculations |
| Division | `FHE.div(a, b)` | Calculate ratios (DTI) |
| Less Than | `FHE.lt(a, b)` | Threshold checks for score clamping |
| Less/Equal | `FHE.le(a, b)` | DTI ratio comparisons |
| Greater Than | `FHE.gt(a, b)` | Upper bound checks |
| Greater/Equal | `FHE.ge(a, b)` | Credit score matching |
| Logical AND | `FHE.and(a, b)` | Combine multiple matching conditions |
| Select | `FHE.select(condition, a, b)` | Conditional value selection |
| Allow This | `FHE.allowThis()` | Grant contract permission to use value |
| Allow | `FHE.allow(value, address)` | Grant user permission to decrypt |
| As Euint64 | `FHE.asEuint64()` | Convert plaintext to encrypted constant |

## Usage Guide

### For Borrowers

**Step 1: Connect Wallet**
```typescript
// Next.js with MetaMask integration
import { getSignerAddress, checkNetwork, switchToSepolia } from '../lib/contract';

const connectWallet = async () => {
  try {
    // Check if on correct network
    const isCorrectNetwork = await checkNetwork();
    
    if (!isCorrectNetwork) {
      await switchToSepolia();
    }
    
    // Get signer address
    const address = await getSignerAddress();
    console.log('Connected wallet:', address);
    return address;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
};
```

**Step 2: Initialize FHE Instance and Encrypt Financial Data**
```typescript
import { createInstance } from '@fhevm/sdk';

// Initialize FHEVM instance
const initFhevm = async () => {
  const instance = await createInstance({
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID as string),
    networkUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    gatewayUrl: 'https://gateway.zama.ai'
  });
  
  return instance;
};
```

**Step 3: Submit Encrypted Data to Contract**
```typescript
import { submitBorrowerData, hasSubmittedData } from '../lib/contract';
import type { FhevmInstance } from "@fhevm-sdk";

const submitFinancialData = async (
  fhevmInstance: FhevmInstance,
  income: number,
  repaymentScore: number,
  liabilities: number,
  signerAddress: string
) => {
  try {
    // Convert to bigint
    const incomeBigInt = BigInt(income);
    const repaymentScoreBigInt = BigInt(repaymentScore);
    const liabilitiesBigInt = BigInt(liabilities);
    
    // Submit encrypted data (encryption happens inside the helper)
    const tx = await submitBorrowerData(
      fhevmInstance,
      incomeBigInt,
      repaymentScoreBigInt,
      liabilitiesBigInt,
      signerAddress
    );
    
    await tx.wait();
    console.log('Financial data submitted successfully!');
    
    // Verify submission
    const dataSubmitted = await hasSubmittedData();
    console.log('Data submitted:', dataSubmitted);
  } catch (error) {
    console.error('Failed to submit data:', error);
  }
};
```

**Step 4: Compute Credit Score**
```typescript
import { computeCreditScore, hasCreditScore, hasSubmittedData } from '../lib/contract';

const calculateCreditScore = async () => {
  try {
    // Check if data has been submitted
    const hasData = await hasSubmittedData();
    
    if (!hasData) {
      throw new Error('Must submit financial data first');
    }
    
    // Compute credit score on-chain (FHE operations happen in smart contract)
    const tx = await computeCreditScore();
    await tx.wait();
    
    console.log('Credit score computed successfully!');
    
    // Verify score exists
    const hasScore = await hasCreditScore();
    console.log('Has credit score:', hasScore);
  } catch (error) {
    console.error('Failed to compute credit score:', error);
  }
};
```

**Step 5: Retrieve Encrypted Credit Score**
```typescript
import { getCreditScore, hasCreditScore } from '../lib/contract';

const getMyScore = async () => {
  try {
    const hasScore = await hasCreditScore();
    
    if (!hasScore) {
      throw new Error('No credit score available');
    }
    
    // Returns encrypted euint64 handle
    const encryptedScore = await getCreditScore();
    console.log('Encrypted score retrieved:', encryptedScore);
    
    // Note: Decryption would require additional setup with FHEVM SDK
    // The encrypted score can only be decrypted by the borrower
    return encryptedScore;
  } catch (error) {
    console.error('Failed to retrieve score:', error);
  }
};
```

**Step 6: Create Loan Request**
```typescript
import { createLoanRequest, getBorrowerLoans } from '../lib/contract';
import type { FhevmInstance } from "@fhevm-sdk";

const requestLoan = async (
  fhevmInstance: FhevmInstance,
  loanAmount: number,
  durationMonths: number,
  signerAddress: string
) => {
  try {
    // Convert to bigint
    const amount = BigInt(loanAmount);
    const duration = BigInt(durationMonths);
    
    // Create loan request with encrypted and plain values
    const tx = await createLoanRequest(
      fhevmInstance,
      amount,
      duration,
      signerAddress
    );
    
    const receipt = await tx.wait();
    console.log('Loan request created successfully!');
    
    // Fetch borrower's loans
    const loans = await getBorrowerLoans(signerAddress);
    console.log('Your loans:', loans);
    
    return loans;
  } catch (error) {
    console.error('Failed to create loan request:', error);
  }
};
```
**Step 7: Deposit Collateral**

```
import { depositCollateral, getUserCollateral, getAvailableCollateral } from './utils/contractHelpers';

const addCollateral = async (amountEth: string, userAddress: string) => {
  try {
    // Deposit collateral
    const tx = await depositCollateral(amountEth);
    await tx.wait();
    
    console.log(`Deposited ${amountEth} ETH as collateral`);
    
    // Check total collateral
    const totalCollateral = await getUserCollateral(userAddress);
    const availableCollateral = await getAvailableCollateral(userAddress);
    
    console.log('Total collateral:', totalCollateral.toString());
    console.log('Available collateral:', availableCollateral.toString());
  } catch (error) {
    console.error('Failed to deposit collateral:', error);
  }
};
```

### For Lenders

**Step 1: Create Offer with Encrypted Criteria**
```typescript
// Encrypt lending criteria
const encryptedMinScore = instance.encrypt64(700);
const encryptedMaxLoan = instance.encrypt64(15000);
const encryptedRate = instance.encrypt64(8); // 8% interest

// Create offer with collateral requirement
const tx = await contract.createLenderOffer(
    encryptedMinScore.handles[0],
    encryptedMinScore.inputProof,
    encryptedMaxLoan.handles[0],
    encryptedMaxLoan.inputProof,
    encryptedRate.handles[0],
    encryptedRate.inputProof,
    5000, // 50% collateral requirement (out of 10000)
    8,    // plainInterestRate for display
    15000, // plainMaxLoanAmount for display
    { value: ethers.utils.parseEther("5") } // Fund with 5 ETH
);

const receipt = await tx.wait();
const offerId = receipt.events[0].args.offerId;
console.log(`Offer created with ID: ${offerId}`);
```

**Step 2: Check for Matches**
```typescript
// Check if a loan matches your offer criteria (encrypted comparison)
const isMatch = await contract.checkLoanMatch(loanId, offerId);

if (isMatch) {
    console.log('Match found! Loan meets your criteria.');
}
```

**Step 3: Fund Matched Loan**
```typescript
// Fund the loan after match confirmation
const tx = await contract.fundLoan(loanId, offerId);
await tx.wait();
console.log('Loan funded successfully!');
```

**Step 4: View Your Offer Metadata**
```typescript
// Retrieve your offer details (only you can see plain values)
const offerMetadata = await contract.getLenderOfferMetadata(offerId);

console.log({
    lender: offerMetadata.lender,
    interestRate: offerMetadata.plainInterestRate,
    maxLoanAmount: offerMetadata.plainMaxLoanAmount,
    availableFunds: offerMetadata.availableFunds,
    isActive: offerMetadata.isActive,
    collateralPercentage: offerMetadata.collateralPercentage
});
```

## Security Considerations

### Encryption Guarantees

**What FHE Protects**:
- Raw financial data (income, liabilities, scores)
- Loan amounts and terms
- Lender criteria and thresholds
- Computed credit scores

**What FHE Doesn't Hide**:
- Transaction metadata (addresses, timestamps, gas fees)
- Whether a match occurred (boolean result)
- Number of active loans (contract state)

### Smart Contract Security

- **Access Control**: Only data owners can decrypt their own scores
- **Reentrancy Protection**: Guards on all fund transfer functions
- **Input Validation**: Type checking on all encrypted inputs
- **Overflow Protection**: Solidity 0.8+ built-in checks

### Privacy Best Practices

1. **Never decrypt scores publicly**: Always decrypt client-side
2. **Use fresh addresses**: Avoid linking to identifiable wallets
3. **Batch operations**: Minimize transaction metadata leakage
4. **Secure key management**: Protect MetaMask private keys

### Known Limitations

- **Computation Cost**: FHE operations are more expensive than plaintext operations
- **Performance**: Encrypted operations are slower (trade-off for privacy)
- **Network Dependency**: Currently deployed on Sepolia testnet with Zama's FHE coprocessor
- **Beta Technology**: Zama FHEVM is still in development
- **Testnet Only**: MVP is on Sepolia testnet - mainnet deployment pending security audits

## Future Roadmap

### Phase 1: Core Enhancements
- [ ] Multi-factor credit scoring models
- [ ] Reputation systems using encrypted history
- [ ] Support for stablecoins (USDC, DAI)
- [ ] Mobile-responsive UI improvements

### Phase 2: Advanced Features
- [ ] Encrypted collateral tracking
- [ ] Automated liquidation mechanisms
- [ ] Credit delegation (lending your credit score)
- [ ] Multi-signature approvals for large loans

### Phase 3: Ecosystem Integration
- [ ] Integration with existing DeFi protocols
- [ ] Cross-chain bridges for multi-network lending
- [ ] Developer SDK for third-party integrations
- [ ] Institutional lender onboarding

### Phase 4: Governance & Scale
- [ ] DAO governance for protocol parameters
- [ ] Staking mechanisms for protocol security
- [ ] Insurance pools for loan defaults
- [ ] Mainnet launch with audited contracts

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue with detailed reproduction steps
2. **Suggest Features**: Discuss ideas in GitHub Discussions
3. **Submit PRs**: Fork the repo, make changes, and submit a pull request
4. **Improve Docs**: Help us make documentation clearer

### Development Guidelines

- Write clear, commented code
- Follow existing code style (Prettier + ESLint configured)
- Add tests for new features
- Update documentation for API changes

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- **Zama**: For pioneering FHEVM technology
- **Ethereum Foundation**: For foundational blockchain research
- **Open Source Community**: For tools and libraries that made this possible

## Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yaji33/privance-fhevm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yaji33/privance-fhevm/discussions)
- **Demo**: [https://privance.vercel.app/home](https://privance.vercel.app/home)

---

**Built with privacy. Powered by mathematics. Secured by cryptography.**
