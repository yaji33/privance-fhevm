"use client";

import { useState } from "react";
import Navbar from "./_components/layout/Navbar"; 
import HomePage from "./_components/dashboard/Home";
import BorrowPage from "./_components/dashboard/Borrow";
import LenderPage from "./_components/dashboard/Lender";
import HowItWorksPage from "./_components/dashboard/How_it_works";

export default function Dashboard() {
  const [activePage, setActivePage] = useState<"Home" | "Borrow" | "Lender" | "HowItWorks">("Home");

  const renderPage = () => {
    switch (activePage) {
      case "Home":
        return <HomePage />;
      case "Borrow":
        return <BorrowPage />;
      case "Lender":
        return <LenderPage />;
      case "HowItWorks":
        return <HowItWorksPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main >{renderPage()}</main>
    </div>
  );
}
