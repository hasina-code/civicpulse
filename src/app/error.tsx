"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-signal-cream px-6 text-center text-signal-navy dark:bg-signal-night dark:text-signal-cream">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
        Something went wrong
      </p>
      <h1 className="mt-4 text-3xl font-bold">We couldn&apos;t load this page.</h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
        Please try again. If the problem continues, come back in a little while.
      </p>
      <button
        className="mt-8 rounded-lg bg-signal-gold px-5 py-3 font-semibold text-signal-navy transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
