"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function PublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {isAuthPage ? null : <Navbar />}
      <main className="flex-1">{children}</main>
      {isAuthPage ? null : <Footer />}
    </div>
  );
}
