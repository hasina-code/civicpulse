"use client";

import {
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserRole } from "../../../shared/constants/roles";
import { USER_ROLE_LABELS } from "../../../shared/constants/roles";
import { apiClient } from "../../lib/api-client";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

const roleNavigation: Record<UserRole, NavItem[]> = {
  CITIZEN: [
    { label: "Overview", href: "/citizen", icon: LayoutDashboard },
    { label: "Report Issue", href: "/citizen/issues/new", icon: MapPin },
    { label: "My Reports", href: "/citizen/issues", icon: ClipboardList },
  ],
  MANAGER: [
    { label: "Triage Overview", href: "/manager", icon: LayoutDashboard },
    { label: "Department Queue", href: "/manager/department-queue", icon: ClipboardList },
    { label: "Reviews", href: "/manager/reviews", icon: ClipboardCheck },
    { label: "Crew & Workload", href: "/manager/crew", icon: Users },
  ],
  STAFF: [
    { label: "Overview", href: "/staff", icon: LayoutDashboard },
    { label: "Assigned Tasks", href: "/staff/tasks", icon: ClipboardCheck },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Analytics", href: "/admin/analytics", icon: LayoutDashboard },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "System", href: "/admin/system", icon: ShieldCheck },
  ],
};

export function DashboardSidebar({
  role,
  userName,
  open,
  collapsed,
  onClose,
}: {
  role: UserRole;
  userName: string;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = roleNavigation[role];
  const activeItemHref = items
    .filter(
      (item) =>
        pathname === item.href ||
        (item.href !== `/${role.toLowerCase()}` &&
          pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const roleLabel =
    role === "MANAGER" && departmentName
      ? `${departmentName} Manager`
      : role === "STAFF" && departmentName
        ? `${departmentName} Staff`
        : USER_ROLE_LABELS[role];

  useEffect(() => {
    let active = true;
    void apiClient
      .get<{ department: { name: string } | null }>("/api/users/me")
      .then((profile) => {
        if (active) {
          setDepartmentName(profile.department?.name ?? null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load account details",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[50] flex w-[260px] flex-col border-r border-[#263653] bg-[#14203a] text-slate-100 transition-[width,transform] lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}`}
    >
      <div className={`flex h-16 items-center border-b border-[#263653] px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link className="flex items-center gap-2" href="/" onClick={onClose}>
          <Image alt="" aria-hidden="true" height={36} priority src="/images/Logo.png" width={36} />
          <div className={`leading-none ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-[13px] font-black tracking-tight text-white">
              CIVIC<span className="text-[#45b9df]">PULSE</span>
            </p>
            <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.16em] text-sky-300">
              Smart City v1.0
            </p>
          </div>
        </Link>
        <button aria-label="Close sidebar" className="lg:hidden" onClick={onClose} type="button">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className={`mx-3 mt-4 rounded border border-[#2d405e] bg-[#1b2a48] px-3 py-2.5 ${collapsed ? "lg:px-0 lg:text-center" : ""}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300">
          <span className={collapsed ? "lg:hidden" : ""}>Role: </span>
          <span className={collapsed ? "lg:hidden" : ""}>{role}</span>
          {collapsed ? <span className="hidden lg:inline">●</span> : null}
        </p>
        <p className={`mt-1 truncate text-xs font-semibold text-slate-100 ${collapsed ? "lg:hidden" : ""}`}>
          {userName}{" "}
          <span className="font-medium text-slate-400">({roleLabel})</span>
        </p>
      </div>

      <nav aria-label="Dashboard navigation" className="mt-5 space-y-1 px-3">
        {items.map((item) => {
          const active = activeItemHref === item.href;
          const Icon = item.icon;
          return (
            <Link
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${
                active
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-300 hover:bg-[#20304f] hover:text-white"
              }`}
              href={item.href}
              key={item.href}
              onClick={onClose}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
        <Link
          className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${
            pathname === "/notifications"
              ? "bg-sky-500 text-slate-950"
              : "text-slate-300 hover:bg-[#20304f] hover:text-white"
          }`}
          href="/notifications"
          onClick={onClose}
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
          <span className={collapsed ? "lg:hidden" : ""}>Notifications</span>
        </Link>
        <Link
          className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-semibold transition ${
            pathname === "/settings"
              ? "bg-sky-500 text-slate-950"
              : "text-slate-300 hover:bg-[#20304f] hover:text-white"
          }`}
          href="/settings"
          onClick={onClose}
        >
          <Settings aria-hidden="true" className="h-4 w-4" />
          <span className={collapsed ? "lg:hidden" : ""}>Profile Settings</span>
        </Link>
      </nav>

      <div className={`mt-auto border-t border-[#263653] px-4 py-3 text-[9px] leading-4 text-slate-500 ${collapsed ? "lg:hidden" : ""}`}>
        Status
        <span className="ml-2 inline-flex items-center gap-1 text-[#55d6a9]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#55d6a9]" />
          Online
        </span>
        <p>PostgreSQL · Near Live</p>
      </div>
    </aside>
  );
}