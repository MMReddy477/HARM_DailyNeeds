import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-[#F8FAFC]">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
