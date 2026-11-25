"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ComponentProps } from "react";

type SessionProviderProps = Pick<
  ComponentProps<typeof NextAuthSessionProvider>,
  "children" | "session"
>;

export function SessionProvider({
  children,
  session,
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
