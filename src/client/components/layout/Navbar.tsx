"use client";

import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { SessionControls } from "./SessionControls";
import { ThemeToggle } from "./ThemeToggle";

const navigationLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Features", href: "/#features" },
  { label: "Portals", href: "/#portals" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-signal-night/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          aria-label="CivicPulse home"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-signal-navy dark:text-signal-cream"
          href="/"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="h-11 w-11 object-contain"
            height={44}
            priority
            src="/images/Logo.png"
            width={44}
          />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight">
              <span  className="text-signal-navy dark:text-signal-cream">Civic</span>
              <span className="text-[#0BA0CB]">Pulse</span>
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Smart City Platform
            </span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-center gap-4 xl:flex 2xl:gap-6"
        >
          {navigationLinks.map((link) => (
            <Link
              className="whitespace-nowrap text-sm font-medium text-slate-600 transition hover:text-signal-blue dark:text-slate-300 dark:hover:text-signal-gold"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <ThemeToggle />
          <SessionControls layout="desktop" />
        </div>
        <MobileMenu links={navigationLinks} />
      </div>
    </header>
  );
}
