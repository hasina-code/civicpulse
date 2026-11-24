import type { DefaultSession } from "next-auth";
import type { UserRole } from "../constants/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      departmentId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    departmentId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    departmentId?: string | null;
  }
}
