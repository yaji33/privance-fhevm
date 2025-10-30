"use client";

import { useState } from "react";

export default function HomePage() {
  const [showDownArrow, setShowDownArrow] = useState(true);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollDown = () => {
    scrollToSection("howItWorks");
    setShowDownArrow(false);
  };

  const handleScrollUp = () => {
    scrollToSection("hero");
    setShowDownArrow(true);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* ===== HERO / DASHBOARD SECTION ===== */}
      <section
        id="hero"
        className="relative h-screen bg-black overflow-hidden flex flex-col justify-center"
      >
        {/* 🌟 Green Glowing Background */}
        <div className="absolute inset-0 flex justify-center">
          <div
            className="w-[1400px] h-[500px] rounded-full blur-[200px] absolute -top-[200px]"
            style={{
              background:
                "radial-gradient(circle at center, rgba(59,238,64,0.25), #17C71C 50%, black 80%)",
            }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="relative text-center px-8 z-10 max-w-5xl mx-auto">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-x-0 bottom-0 h-3 bg-green-600/40 rounded filter blur-xl z-0"></div>

            <div className="relative px-4 py-2 rounded-full bg-gradient-to-b from-green-600 via-[#1F3820] to-[#1F3820] shadow-[0_0_4px_#1F3820] z-10 mt-20">
              <span className="text-white text-sm flex items-center gap-2 justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Powered by Zama FHEVM
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Privacy-First DeFi Lending
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            The first decentralized lending marketplace where lenders compute
            creditworthiness on encrypted data — without ever seeing your
            personal information.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <a
              href="/borrow"
              className="bg-[#98E29D] text-gray-900 px-5 py-2 rounded-md text-sm font-semibold hover:bg-green-300 transition"
            >
              Start Borrowing
            </a>
            <a
              href="/lender"
              className="border border-green-400 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-400 hover:text-gray-900 transition"
            >
              Become a Lender
            </a>
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
            {[
              {
                id: "01",
                title: "Fully Encrypted",
                desc: "Your financial data stays encrypted end-to-end",
              },
              {
                id: "02",
                title: "Zero Knowledge",
                desc: "Credit scoring without revealing sensitive information",
              },
              {
                id: "03",
                title: "Fair Access",
                desc: "Objective lending based on encrypted analytics",
              },
            ].map((card) => (
              <div
                key={card.id}
                className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-green-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">
                    {card.id}
                  </span>
                </div>
                <h3 className="text-white text-left text-xl md:text-2xl font-semibold mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-300 text-left">{card.desc}</p>
                <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#B7E350] to-[#22430C]"></div>
              </div>
            ))}
          </div>

          {/* ↓ Scroll Down Button (only visible when showDownArrow = true) */}
          {showDownArrow && (
            <button
              onClick={handleScrollDown}
              className="fixed bottom-8 right-8 flex items-center justify-center w-14 h-14 rounded-full border-2 border-green-400 hover:border-green-300 transition shadow-[0_0_20px_#17C71C] hover:shadow-[0_0_30px_#17C71C] animate-bounce z-50 bg-black/50 backdrop-blur-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section
        id="howItWorks"
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-[#17C71C] text-white overflow-hidden px-6 py-24"
      >
        {/* Title */}
        <div className="text-center mb-24">
          <h2 className="text-5xl font-semibold">
            How{" "}
            <span className="bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">
              Privance
            </span>{" "}
            Works?
          </h2>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto mt-10">
          {/* Curved Line */}
          <svg
            className="absolute hidden lg:block top-[-50px] left-0 w-full h-[200px] pointer-events-none z-20"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 200"
            fill="none"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1200" y2="0">
                <stop stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M100 100 C400 20, 800 180, 1100 100"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          </svg>

          {/* Steps */}
          {[
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 10V7a4 4 0 10-8 0v3M5 10h14v10H5V10z"
                />
              ),
              num: "1",
              title: "Encrypt Your Data",
              desc: "Connect your wallet and encrypt your credit information using FHE.",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3"
                />
              ),
              num: "2",
              title: "Smart Matching",
              desc: "Our FHEVM contracts compute compatibility while keeping data private.",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 14h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ),
              num: "3",
              title: "Secure Lending",
              desc: "Get matched and funded without ever revealing your private information.",
            },
          ].map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-4 w-full lg:w-1/3 mt-16 lg:mt-0 relative z-20"
            >
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#0f1f0e]/80 border border-[#17C71C]/50 backdrop-blur-md shadow-[0_0_30px_#17C71C]/40">
                <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full -z-10"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {step.icon}
                </svg>
              </div>
              <h3 className="text-5xl font-bold bg-gradient-to-b from-green-300 to-green-500 text-transparent bg-clip-text">
                {step.num}
              </h3>
              <h4 className="text-lg font-medium mt-2">{step.title}</h4>
              <p className="text-sm text-gray-200 max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* ↑ Scroll Up Button (only visible when showDownArrow = false) */}
        {!showDownArrow && (
          <button
            onClick={handleScrollUp}
            className="fixed bottom-8 right-8 flex items-center justify-center w-14 h-14 rounded-full border-2 border-green-400 hover:border-green-300 transition shadow-[0_0_20px_#17C71C] hover:shadow-[0_0_30px_#17C71C] bg-black/50 backdrop-blur-md z-50"
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
