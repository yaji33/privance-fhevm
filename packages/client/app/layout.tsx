import "@rainbow-me/rainbowkit/styles.css";
import Footer from "~~/app/_components/layout/Footer";
import Navbar from "~~/app/_components/layout/Navbar";
import { DappWrapperWithProviders } from "~~/components/DappWrapperWithProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/helper/getMetadata";

export const metadata = getMetadata({
  title: "Privance",
  description: "Built with FHEVM",
});

const DappWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=telegraf@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DappWrapperWithProviders>
          <Navbar />
          {children}
          <Footer />
        </DappWrapperWithProviders>
      </body>
    </html>
  );
};

export default DappWrapper;
