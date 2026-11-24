import type { UserRole } from "./roles";

export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const DASHBOARD_ROUTES = {
  ADMIN: "/admin/analytics",
  MANAGER: "/manager/issues",
  STAFF: "/staff/tasks",
  CITIZEN: "/citizen/issues",
} as const satisfies Record<UserRole, string>;
