"use client";

import Image from "next/image";
import {
  LayoutGrid,
  LogIn,
  LogOut,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from "../../../shared/constants/routes";

const reportIssueClassName =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#0BA0CB] px-3.5 py-2 text-sm font-semibold text-[#0B1120] transition hover:bg-[#0992B4]";

type AvatarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "U").toUpperCase();
}

export function ProfileAvatar({ user }: { user: AvatarUser }) {
  const [failedAvatarImage, setFailedAvatarImage] = useState<string | null>(
    null,
  );
  const userName = user.name?.trim() || user.email || "User";
  const avatarImage =
    user.image && failedAvatarImage !== user.image ? user.image : null;

  return (
    <span
      aria-hidden="true"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#111C33] text-sm font-bold text-white ring-2 ring-[#2563EB]"
    >
      {getInitials(userName)}
      {avatarImage ? (
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-10 h-full w-full object-cover"
          height={40}
          onError={() => setFailedAvatarImage(avatarImage)}
          src={avatarImage}
          unoptimized
          width={40}
        />
      ) : null}
    </span>
  );
}

export function SessionControls({
  layout,
  onNavigate,
}: {
  layout: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (status === "loading") {
    return null;
  }

  const reportIssueLink = (
    <Link
      className={reportIssueClassName}
      href={session?.user ? "/citizen/report" : PUBLIC_ROUTES.LOGIN}
      onClick={onNavigate}
    >
      Report Issue
    </Link>
  );

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div
        className={
          layout === "desktop"
            ? "flex shrink-0 items-center gap-2"
            : "space-y-2 px-2"
        }
      >
        {reportIssueLink}
        <div className={layout === "desktop" ? "flex items-center gap-2" : "grid grid-cols-2 gap-2"}>
          <Link
            className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-signal-navy transition hover:bg-signal-cream dark:text-slate-100 dark:hover:bg-slate-800"
            href={PUBLIC_ROUTES.LOGIN}
            onClick={onNavigate}
          >
            Login
          </Link>
          <Link
            className="rounded-lg bg-[#0BA0CB] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#087F9F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BA0CB]"
            href={PUBLIC_ROUTES.REGISTER}
            onClick={onNavigate}
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  const { user } = session;
  const userName = user.name?.trim() || user.email || "User";
  const role = user.role;
  const dashboardHref = DASHBOARD_ROUTES[role];
  const avatar = <ProfileAvatar user={user} />;

  const menu = (
    <>
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {user.name || userName}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
        <span className="mt-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300">
          {role}
        </span>
      </div>
      <div className="space-y-1 border-b border-slate-200 p-2 dark:border-slate-700">
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/10"
          href={dashboardHref}
          onClick={() => {
            setIsOpen(false);
            onNavigate?.();
          }}
          role="menuitem"
        >
          <LayoutGrid aria-hidden="true" className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/10"
          href="/profile"
          onClick={() => {
            setIsOpen(false);
            onNavigate?.();
          }}
          role="menuitem"
        >
          <UserRound aria-hidden="true" className="h-4 w-4" />
          Profile Settings
        </Link>
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/10"
          href={PUBLIC_ROUTES.LOGIN}
          onClick={() => {
            setIsOpen(false);
            onNavigate?.();
          }}
          role="menuitem"
        >
          <LogIn aria-hidden="true" className="h-4 w-4" />
          Log In / Switch Account
        </Link>
        <Link
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-white/10"
          href={PUBLIC_ROUTES.REGISTER}
          onClick={() => {
            setIsOpen(false);
            onNavigate?.();
          }}
          role="menuitem"
        >
          <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
          Register New User
        </Link>
      </div>
      <div className="p-2">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
          onClick={() => {
            onNavigate?.();
            void signOut({ callbackUrl: "/" });
          }}
          role="menuitem"
          type="button"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  if (layout === "mobile") {
    return (
      <div className="space-y-2 px-2">
        {reportIssueLink}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-[#111C33] dark:text-slate-100">
          {menu}
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      {reportIssueLink}
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Open profile menu"
          className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          {avatar}
        </button>
        {isOpen ? (
          <div
            aria-label="Profile menu"
            className="absolute right-0 top-full z-[60] mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl dark:border-slate-700 dark:bg-[#111C33] dark:text-slate-100"
            role="menu"
          >
            {menu}
          </div>
        ) : null}
      </div>
    </div>
  );
}
