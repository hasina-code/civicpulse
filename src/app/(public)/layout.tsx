import type { ReactNode } from "react";
import { PublicChrome } from "../../client/components/layout/PublicChrome";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
