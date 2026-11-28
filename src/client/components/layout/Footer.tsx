import { ArrowUpRight, Radio } from "lucide-react";
import Link from "next/link";

const publicLinks = [
  { label: "Home", href: "/#home" },
  { label: "Services", href: "/#services" },
  { label: "FAQs", href: "/#faqs" },
];

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-signal-night dark:text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
          <div>
            <Link
              className="inline-flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-900 dark:text-white"
              href="/"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400">
                <Radio aria-hidden="true" className="h-4 w-4" />
              </span>
              <span>
                Civic
                <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                  Pulse
                </span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              Connecting communities with the city services that keep them
              moving. Report municipal issues with precision and track every
              resolution step.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Municipal Service Portal</span>
            </div>
          </div>


          <div>
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
              Explore
            </h2>
            <ul className="mt-4 space-y-3">
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="group inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
                    href={link.href}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
              Your account
            </h2>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="group inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
                    href={link.href}
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>


        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CivicPulse. All rights reserved.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Dhaka City Infrastructure &amp; Citizen Dispatch
          </p>
        </div>
      </div>
    </footer>
  );
}