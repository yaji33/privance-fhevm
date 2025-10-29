import BorrowerForm from "./_components/BorrowerForm";
import CreditScoreDisplay from "./_components/CreditScoreDisplay";
import { FHECounterDemo } from "./_components/FHECounterDemo";
import WalletConnect from "./_components/WalletConnect";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/*<FHECounterDemo />*/}
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Confidential Credit Scoring</h1>
          <p className="text-slate-400 text-lg">Secure, blockchain-based credit evaluation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <WalletConnect />
            <BorrowerForm />
          </div>

          <div className="lg:sticky lg:top-8">
            <CreditScoreDisplay />
          </div>
        </div>

        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>Powered by blockchain technology for maximum privacy and security</p>
        </div>
      </div>
    </main>
  );
}
