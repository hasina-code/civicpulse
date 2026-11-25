import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "../client/providers/QueryProvider";
import { SessionProvider } from "../client/providers/SessionProvider";
import { ThemeProvider } from "../client/providers/ThemeProvider";
import { ToastProvider } from "../client/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CivicPulse",
    template: "%s | CivicPulse",
  },
  description: "A smarter way to report and resolve city infrastructure issues.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <ToastProvider>{children}</ToastProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
