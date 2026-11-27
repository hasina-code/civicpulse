"use client";

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { DASHBOARD_ROUTES } from "../../../shared/constants/routes";
import type { UserRole } from "../../../shared/constants/roles";
import { USER_ROLE_LABELS } from "../../../shared/constants/roles";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

type DashboardUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
};

export function DashboardTopbar({
  role,
  user,
  onOpenSidebar,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  role: UserRole;
  user: DashboardUser;
  onOpenSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const initials = (user.name || user.email || "User")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const displayName = user.name?.trim() || user.email || "User";

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !profileMenuRef.current?.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#263653] bg-[#14203a] px-4 text-white lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open sidebar"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[#334760] lg:hidden"
          onClick={onOpenSidebar}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#263653] bg-[#111c33] text-slate-300 transition hover:border-[#5b82e8] hover:text-white lg:flex"
          onClick={onToggleSidebar}
          type="button"
        >
          {sidebarCollapsed ? (
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold sm:text-base">Infrastructure Operations</h1>
          <p className="mt-0.5 hidden text-[9px] text-slate-400 sm:block">
            Dhaka Smart Grid · Real-Time Triage
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
        <div className="relative" ref={profileMenuRef}>
          <button
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            aria-label={`Open profile menu for ${displayName}`}
            className={`flex h-11 items-center gap-2 rounded-xl border px-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              profileMenuOpen
                ? "border-[#4264ff] bg-[#1b2a48]"
                : "border-transparent hover:border-[#263653] hover:bg-[#1b2a48]"
            }`}
            onClick={() => setProfileMenuOpen((open) => !open)}
            type="button"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400 bg-sky-500 text-xs font-bold text-slate-950">
              {initials}
              {user.image ? (
                <Image
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                  src={user.image}
                  unoptimized
                />
              ) : null}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-32 truncate text-xs font-bold text-white">
                {displayName}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {USER_ROLE_LABELS[role]}
              </span>
            </span>
          </button>
          {profileMenuOpen ? (
            <div
              aria-label="Profile menu"
              className="absolute right-0 top-full z-[60] mt-2 w-[280px] overflow-hidden rounded-2xl border border-[#33415f] bg-[#0d1738] text-white shadow-2xl"
              role="menu"
            >
              <div className="border-b border-[#243254] px-5 py-5">
                <p className="truncate text-sm font-bold">{displayName}</p>
                <p className="mt-1 truncate text-sm text-slate-400">
                  {user.email || "No email address"}
                </p>
                <span className="mt-2 inline-flex rounded border border-[#263b79] bg-[#121f4d] px-2 py-0.5 text-[10px] font-semibold text-[#6b8cff]">
                  {role}
                </span>
              </div>
              <div className="border-b border-[#243254] py-1.5">
                <Link
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-300 transition hover:bg-[#162044] hover:text-white"
                  href={DASHBOARD_ROUTES[role]}
                  onClick={() => setProfileMenuOpen(false)}
                  role="menuitem"
                >
                  <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-sky-400" />
                  Dashboard
                </Link>
                <Link
                  className="flex items-center gap-3 px-5 py-3 text-sm text-slate-300 transition hover:bg-[#162044] hover:text-white"
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  role="menuitem"
                >
                  <UserRound aria-hidden="true" className="h-4 w-4 text-sky-400" />
                  Profile
                </Link>
              </div>
              <div className="py-1.5">
                <button
                  className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-[#ff4d5d] transition hover:bg-[#162044]"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  role="menuitem"
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
