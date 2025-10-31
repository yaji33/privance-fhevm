"use client";

import Image from "next/image";
import Link from "next/link";
import PrivanceLogo from "../../../public/3.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Borrow", href: "/borrow" },
      { name: "Lend", href: "/lender" },
      { name: "Marketplace", href: "/marketplace" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
    ],
    community: [
      { name: "Twitter", href: "#" },
      { name: "Discord", href: "#" },
      { name: "GitHub", href: "https://github.com/yaji33/privance-fhevm" },
    ],
  };

  return (
    <footer className="bg-slate-900/40 backdrop-blur-lg border-t border-white/10 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={PrivanceLogo}
                alt="Privance Logo"
                width={32}
                height={32}
                className="w-24 h-24 object-contain"
              />
            </div>
            <p className="text-slate-400 text-sm">
              Privacy-focused decentralized lending platform powered by FHE technology.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-green-400 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-green-400 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-green-400 transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">© {currentYear} Privance. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Built with FHE</span>
            <span>•</span>
            <span>Secured by Blockchain</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
