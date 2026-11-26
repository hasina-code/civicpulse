import type { UserRole } from "./roles";

export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const DASHBOARD_ROUTES = {
  ADMIN: "/admin",
  MANAGER: "/manager",
  STAFF: "/staff",
  CITIZEN: "/citizen",
} as const satisfies Record<UserRole, string>;
