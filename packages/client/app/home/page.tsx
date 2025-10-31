"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [showDownArrow, setShowDownArrow] = useState(true);
  const router = useRouter();
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollDown = () => {
    scrollToSection("footer");
    setShowDownArrow(false);
  };

  const handleScrollUp = () => {
    scrollToSection("hero");
    setShowDownArrow(true);
  };

  return (
    <div className="relative w-full overflow-hidden">
      <section id="hero" className="relative h-screen bg-black overflow-hidden flex flex-col justify-center pt-20">
        <div className="absolute inset-0 flex justify-center">
          <div
            className="w-[1400px] h-[500px] blur-[200px] absolute -top-[200px]"
            style={{
              background: "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 50%, black 80%)",
            }}
          ></div>
        </div>

        <div className="flex flex-col gap-4 text-center px-8 z-10 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Privacy-First DeFi Lending</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Compute your credit score and match with lenders — without revealing your financial data. Powered by Fully
            Homomorphic Encryption (FHE) on Zama&apos;s FHEVM.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/borrow")}
              className="bg-[#98E29D] text-gray-900 px-5 py-2 text-sm font-semibold hover:bg-green-300 transition"
            >
              Start Borrowing
            </button>
            <button
              onClick={() => router.push("/lender")}
              className="border border-green-100 text-white px-5 py-2 text-sm font-medium hover:bg-green-400 hover:text-gray-900 transition"
            >
              Become a Lender
            </button>
          </div>

          {showDownArrow && (
            <button
              onClick={handleScrollDown}
              className="fixed bottom-8 right-8 flex rounded-full items-center justify-center w-14 h-14 border-2 border-green-400 hover:border-green-300 transition hover:shadow-[0_0_30px_#17C71C] animate-bounce z-50 bg-black/50 backdrop-blur-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* ===== CORE FEATURES ===== */}
      <section
        id="coreFeatures"
        className="relative w-full min-h-screen flex items-center justify-center bg-black text-white overflow-hidden py-24 px-6"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-green-900/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold mb-4">
              Core{" "}
              <span className="bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">
                Features
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Three pillars of privacy-preserving DeFi</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: "01",
                title: "Confidential Borrowing",
                desc: "Borrowers encrypt income, liabilities, and repayment data before submission. Information stays private at all times.",
              },
              {
                id: "02",
                title: "Private Lending Insights",
                desc: "Lenders analyze encrypted data on-chain to evaluate creditworthiness without accessing personal details.",
              },
              {
                id: "03",
                title: "Decentralized Trust",
                desc: "Smart contracts manage scoring and matching transparently with no intermediaries or central databases.",
              },
            ].map(card => (
              <div
                key={card.id}
                className="bg-black/20 backdrop-blur-lg p-8 border border-white/10 hover:border-green-800 transition-all duration-300 group hover:shadow-lg hover:shadow-green-900/20"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">
                    {card.id}
                  </span>
                </div>
                <h3 className="text-white text-left text-xl md:text-2xl font-semibold mb-3">{card.title}</h3>
                <p className="text-gray-300 text-left mb-4">{card.desc}</p>
                <div className="h-1 w-full bg-gradient-to-r from-[#B7E350] to-[#22430C] group-hover:shadow-lg group-hover:shadow-green-500/50 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        id="howItWorks"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white overflow-hidden px-6 py-24"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-900/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center mb-20 relative z-10">
          <h2 className="text-5xl font-semibold">
            How{" "}
            <span className="bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">Privance</span>{" "}
            Works
          </h2>
          <p className="text-gray-400 mt-4 text-lg">Four simple steps to private lending</p>
        </div>

        <div className="relative w-full max-w-4xl mx-auto mt-10 z-10">
          {[
            {
              num: "1",
              title: "Encrypt Your Financial Data",
              desc: "Borrowers encrypt income, liabilities, and repayment history before submission. The contract never sees plaintext data.",
            },
            {
              num: "2",
              title: "On-Chain Confidential Computation",
              desc: "Zama&apos;s FHEVM smart contract computes a credit score directly on encrypted inputs using homomorphic math.",
            },
            {
              num: "3",
              title: "Decrypt Privately",
              desc: "Only the borrower can decrypt their computed credit score locally with their wallet-linked FHE keys.",
            },
            {
              num: "4",
              title: "Private Lending Marketplace",
              desc: "Lenders define encrypted lending thresholds. Matching happens on-chain without revealing scores or borrower identity.",
            },
          ].map((step, index) => (
            <div key={index} className="relative flex items-start gap-6 mb-16 last:mb-0 group">
              <div className="relative flex-shrink-0">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-900/40 to-emerald-950/40 border-2 border-green-600/30 backdrop-blur-sm group-hover:border-green-500/60 transition-all duration-300">
                  <span className="text-2xl font-bold text-green-400">{step.num}</span>
                </div>

                {index < 3 && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-green-600/30 to-transparent"></div>
                )}
              </div>

              <div className="flex-1 bg-gradient-to-br from-slate-900/50 to-slate-950/30 border border-slate-800/50 p-6 backdrop-blur-sm group-hover:border-green-900/50 group-hover:shadow-lg group-hover:shadow-green-900/10 transition-all duration-300">
                <h4 className="text-xl font-semibold mb-3 text-white">{step.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {!showDownArrow && (
          <button
            onClick={handleScrollUp}
            className="fixed bottom-8 rounded-full right-8 flex items-center justify-center w-14 h-14 border-2 border-green-400 hover:border-green-300 transition shadow-[0_0_20px_#17C71C] hover:shadow-[0_0_30px_#17C71C] bg-black/50 backdrop-blur-md z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </section>

      {/* ===== WHY ZAMA FHEVM ===== */}
      <section className="bg-black text-white py-24 px-8 text-center">
        <h2 className="text-4xl font-semibold mb-10">Why Zama&apos;s FHEVM?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "True Privacy",
              desc: "Data is encrypted end-to-end, ensuring no plaintext ever touches the blockchain.",
            },
            {
              title: "Confidential Computation",
              desc: "Smart contracts operate directly on encrypted data — no decryption needed.",
            },
            {
              title: "Fair & Objective Lending",
              desc: "Lenders assess encrypted metrics without personal bias or exposure.",
            },
            {
              title: "Compliant by Design",
              desc: "Fully aligned with GDPR and PDPA privacy frameworks.",
            },
          ].map((f, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-700 p-6 hover:border-green-600 transition">
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEVELOPER INFO ===== */}
      <section className="bg-black text-white py-24 px-8">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 p-12 text-center backdrop-blur-sm">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built on Zama&apos;s FHEVM</h2>
          <p className="text-slate-300 text-lg mb-10 max-w-3xl mx-auto leading-relaxed">
            Privance leverages Fully Homomorphic Encryption to enable confidential smart contracts. Deployed on Sepolia
            testnet, we're pioneering privacy-preserving DeFi infrastructure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-black/30 border border-green-900/30 p-6 ">
              <h3 className="text-xl font-semibold mb-2 text-green-400"> Sepolia Testnet</h3>
              <p className="text-slate-400 text-sm">
                Test Privance with Sepolia ETH. Get testnet tokens from faucets and experience encrypted lending
                risk-free.
              </p>
            </div>

            <div className="bg-black/30 border border-green-900/30 p-6 ">
              <h3 className="text-xl font-semibold mb-2 text-green-400"> Zama FHEVM</h3>
              <p className="text-slate-400 text-sm">
                Powered by Zama&apos;s FHEVM — enabling computation on encrypted data without ever exposing plaintext
                values.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/zama-ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#98E29D] text-gray-900 font-semibold hover:bg-green-300 transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Explore FHEVM
            </a>
            <a
              href="https://www.zama.ai/programs/developer-program"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-green-100 text-white font-semibold hover:bg-green-400/10 transition"
            >
              Join Zama Builders
            </a>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-gradient-to-b from-[#0f1f0e] to-black text-center py-24 text-white" id="footer">
        <h2 className="text-4xl font-bold mb-6">Experience Encrypted Finance</h2>
        <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
          Privance is live on Sepolia. Compute your confidential credit score and join the future of privacy-preserving
          DeFi lending.
        </p>
        <button
          onClick={() => router.push("/borrow")}
          className="inline-block px-6 py-3 bg-[#98E29D] text-gray-900 font-semibold rounded hover:bg-green-300 shadow-lg transition"
        >
          Try the MVP
        </button>
        {!showDownArrow && (
          <button
            onClick={handleScrollUp}
            className="fixed bottom-8 rounded-full right-8 flex items-center justify-center w-14 h-14 border-2 border-green-400 hover:border-green-300 transition shadow-[0_0_20px_#17C71C] hover:shadow-[0_0_30px_#17C71C] bg-black/50 backdrop-blur-md z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </section>
    </div>
  );
}
