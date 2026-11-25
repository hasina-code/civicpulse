"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from "../../../shared/constants/routes";
import { USER_ROLE_LABELS } from "../../../shared/constants/roles";

export function SessionControls({
  layout,
}: {
  layout: "desktop" | "mobile";
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <div
        className={
          layout === "desktop"
            ? "flex items-center gap-2"
            : "grid grid-cols-2 gap-2 px-2"
        }
      >
        <Link
          className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-signal-navy transition hover:bg-signal-cream dark:text-slate-100 dark:hover:bg-slate-800"
          href={PUBLIC_ROUTES.LOGIN}
        >
          Login
        </Link>
        <Link
          className="rounded-lg bg-signal-gold px-4 py-2 text-center text-sm font-semibold text-signal-navy transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
          href={PUBLIC_ROUTES.REGISTER}
        >
          Register
        </Link>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const userName = user.name ?? user.email ?? "User";

  return (
    <div
      className={
        layout === "desktop"
          ? "flex items-center gap-2"
          : "flex flex-col gap-3 px-2"
      }
    >
      <Link
        className="rounded-lg bg-signal-navy px-3 py-2 text-center text-sm font-semibold text-signal-gold transition hover:bg-signal-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
        href={DASHBOARD_ROUTES[user.role]}
      >
        Dashboard
      </Link>
      <div
        className={
          layout === "desktop"
            ? "max-w-36 text-right"
            : "flex items-center justify-between gap-3"
        }
      >
        <span className="block truncate text-sm font-semibold text-signal-navy dark:text-slate-100">
          {userName}
        </span>
        <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {USER_ROLE_LABELS[user.role]}
        </span>
      </div>
      <button
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-signal-navy transition hover:bg-signal-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        onClick={() => void signOut({ callbackUrl: "/" })}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
