"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SessionControls } from "./SessionControls";
import { ThemeToggle } from "./ThemeToggle";

type NavigationLink = {
  label: string;
  href: string;
};

export function MobileMenu({ links }: { links: NavigationLink[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative xl:hidden">
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-signal-navy hover:bg-signal-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue dark:text-signal-cream dark:hover:bg-slate-800"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {isOpen ? (
          <X aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Menu aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
      {isOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100vh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-signal-night"
        >
          {links.map((link) => (
            <Link
              className="block rounded-lg px-3 py-3 text-sm font-medium text-signal-navy hover:bg-signal-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal-blue dark:text-slate-100 dark:hover:bg-slate-800"
              href={link.href}
              key={link.label}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="mb-3 px-2">
              <ThemeToggle />
            </div>
            <SessionControls layout="mobile" />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
