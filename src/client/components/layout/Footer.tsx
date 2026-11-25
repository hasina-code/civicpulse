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
    <footer className="bg-signal-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <Link className="text-xl font-bold tracking-tight" href="/">
            CivicPulse
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
            Connecting communities with the city services that keep them moving.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-signal-gold">
            Explore
          </h2>
          <ul className="mt-4 space-y-3">
            {publicLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="text-sm text-slate-300 transition hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-signal-gold">
            Your account
          </h2>
          <ul className="mt-4 space-y-3">
            {accountLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="text-sm text-slate-300 transition hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-slate-400 sm:px-8">
          © {new Date().getFullYear()} CivicPulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
