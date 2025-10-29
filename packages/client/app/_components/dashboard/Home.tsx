"use client";
import Navbar from "../layout/Navbar";

export default function Dashboard() {
  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col justify-center">
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
          {/* Blurred glow bottom layer */}
          <div className="absolute inset-x-0 bottom-0 h-3 bg-green-600/40 rounded filter blur-xl z-0"></div>

          {/* Gradient Badge */}
          <div className="relative px-4 py-2 rounded-full bg-gradient-to-b from-green-600 via-[#1F3820] to-[#1F3820] shadow-[0_0_4px_#1F3820] z-10 mt-25">
            <span className="text-white text-sm flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <a
            href="/borrow"
            className="bg-[#98E29D] text-gray-900 px-7 py-3 rounded-lg font-semibold hover:bg-green-300 transition"
          >
            Start Borrowing
          </a>
          <a
            href="/lender"
            className="border-2 border-green-400 text-white px-7 py-3 rounded-lg font-medium hover:bg-green-400 hover:text-gray-900 transition"
          >
            Become a Lender
          </a>
        </div>
      </div>

      {/* Features — smaller and aligned at bottom */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 px-8 md:px-20 pb-10 max-w-6xl mx-auto z-10">
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
            className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-green-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl md:text-5xl font-bold bg-gradient-to-b from-[#B7E350] to-[#22430C] text-transparent bg-clip-text">
                {card.id}
              </span>
            </div>
            <h3 className="text-white text-xl md:text-2xl font-semibold mb-2">
              {card.title}
            </h3>
            <p className="text-gray-300">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
