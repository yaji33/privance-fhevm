"use client";
import WalletConnect from "../WalletConnect";

type NavbarProps = {
  activePage: string;
  setActivePage: (page: "Home" | "Borrow" | "Lender" | "Marketplace") => void;
};

export default function Navbar({ activePage, setActivePage }: NavbarProps) {
  const navLinks = [
    { name: "Home", page: "Home" },
    { name: "Borrow", page: "Borrow" },
    { name: "Lender", page: "Lender" },
    { name: "Marketplace", page: "Marketplace" },
  ];

  return (
    <nav className="fixed w-full z-50  text-white">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-5">
        <div className="text-2xl font-bold tracking-wide">Privance</div>
        <div className="flex items-center gap-10 font-medium">
          {navLinks.map(link => (
            <button
              key={link.name}
              onClick={() => setActivePage(link.page as any)}
              className={`relative transition-colors duration-200 pb-1 ${
                activePage === link.page ? "text-white border-b-2 border-green-400" : "hover:text-green-400"
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>
        <div className="ml-6">
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
