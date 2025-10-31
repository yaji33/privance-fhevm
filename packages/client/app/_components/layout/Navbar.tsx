"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PrivanceLogo from "../../../public/3.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

function NavbarWalletConnect() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex items-center gap-3">
      {isConnected && address ? (
        <ConnectButton.Custom>
          {({ openAccountModal }) => (
            <button
              onClick={openAccountModal}
              className="hidden md:flex items-center gap-2 px-3 py-1.5
                         bg-emerald-500/10 hover:bg-emerald-500/20
                         border border-emerald-500/30 transition-all duration-200
                         text-emerald-400 text-xs font-mono"
            >
              <div className="w-2 h-2 bg-emerald-500 animate-pulse"></div>
              <span>
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </button>
          )}
        </ConnectButton.Custom>
      ) : (
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            const ready = mounted;
            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                <button
                  onClick={openConnectModal}
                  type="button"
                  className="bg-[#98E29D] text-gray-900 px-5 py-2.5
                             text-sm font-semibold hover:bg-green-300
                             transition shadow-sm hover:shadow-green-500/30"
                >
                  Connect Wallet
                </button>
              </div>
            );
          }}
        </ConnectButton.Custom>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Borrow", href: "/borrow" },
    { name: "Lender", href: "/lender" },
    { name: "Marketplace", href: "/marketplace" },
  ];

  return (
    <nav className="fixed w-full z-50 text-white backdrop-blur-lg bg-slate-900/40 border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={PrivanceLogo}
            alt="Privance Logo"
            width={40}
            height={40}
            priority
            className="w-36 h-36 object-contain absolute"
          />
        </Link>

        {/* Navigation Links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 font-medium">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative transition-colors duration-200 pb-1 ${
                  isActive ? "text-white border-b-2 border-green-400" : "text-slate-300 hover:text-green-400"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Wallet Connect */}
        <NavbarWalletConnect />
      </div>
    </nav>
  );
}
