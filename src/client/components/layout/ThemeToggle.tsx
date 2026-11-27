"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#334760] bg-[#1b2a48] text-slate-200 transition hover:border-[#5b82e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={label}
      type="button"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5" />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5" />
      )}
    </button>
  );
}
