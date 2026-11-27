"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DashboardSidebar } from "../../client/components/layout/DashboardSidebar";
import { DashboardTopbar } from "../../client/components/layout/DashboardTopbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111c33] text-sm text-slate-300">
        Loading CivicPulse...
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f5ee] text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        role={session.user.role}
        userName={session.user.name?.trim() || session.user.email || "User"}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-[49] bg-slate-950/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}
      <div className={sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"}>
        <DashboardTopbar
          sidebarCollapsed={sidebarCollapsed}
          role={session.user.role}
          user={session.user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  );
}
