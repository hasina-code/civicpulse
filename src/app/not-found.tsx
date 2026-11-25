import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-signal-cream px-6 text-center text-signal-navy dark:bg-signal-night dark:text-signal-cream">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-signal-blue">
        404 — Page not found
      </p>
      <h1 className="mt-4 text-4xl font-bold">This page isn&apos;t here.</h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
        The link may be incorrect, or the page may have moved.
      </p>
      <Link
        className="mt-8 rounded-lg bg-signal-gold px-5 py-3 font-semibold text-signal-navy transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
        href="/"
      >
        Return home
      </Link>
    </main>
  );
}
