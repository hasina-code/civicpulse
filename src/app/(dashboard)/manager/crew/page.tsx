"use client";

import {
  CheckCircle2,
  Clock3,
  Mail,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";
import type { ManagerOverview } from "../../../../shared/types/manager-dashboard";

type CrewMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  departmentId: string | null;
  createdAt: string;
};

type CrewResult = {
  items: CrewMember[];
  total: number;
};

export default function ManagerCrewPage() {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      apiClient.get<CrewResult>("/api/users?role=STAFF&limit=100&page=1"),
      apiClient.get<ManagerOverview>("/api/manager/overview"),
    ])
      .then(([crewResult, overviewResult]) => {
        if (active) {
          setMembers(crewResult.items);
          setOverview(overviewResult);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load crew and workload",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleMembers = members.filter((member) =>
    `${member.name} ${member.email} ${member.phone ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const workload = overview?.crew ?? [];
  const maxOrders = Math.max(1, ...workload.map((member) => member.activeWorkOrders));
  const activeMembers = overview?.activeCrewMembers ?? members.filter((member) => member.isActive).length;

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">
          Department Operations
        </p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Crew &amp; Workload
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Maintenance staff and active assignments for your department.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={Users} label="Crew Members" value={members.length} />
        <Stat icon={CheckCircle2} label="Active Staff" value={activeMembers} />
        <Stat
          icon={Clock3}
          label="Active Work Orders"
          value={overview?.activeWorkOrders ?? 0}
        />
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-sky-500 dark:border-white/10 dark:bg-slate-900"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search crew..."
          value={search}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Field Crew Roster
            </h2>
          </div>
          {loading ? (
            <div className="h-52 animate-pulse bg-slate-100 dark:bg-slate-900" />
          ) : visibleMembers.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-slate-500">
              No crew members found.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {visibleMembers.map((member) => (
                <article
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  key={member.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-mono text-sm font-black text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                      {member.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      member.isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Active Workload
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Work orders assigned to field staff
              </p>
            </div>
            <Wrench className="h-4 w-4 text-sky-500" />
          </div>
          {loading ? (
            <div className="h-52 animate-pulse bg-slate-100 dark:bg-slate-900" />
          ) : workload.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-slate-500">
              No active staff assignments.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {workload.map((member) => {
                const loadPercent = Math.round(
                  (member.activeWorkOrders / maxOrders) * 100,
                );
                return (
                  <li className="p-5" key={member.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 font-mono text-xs font-bold text-sky-700 dark:text-sky-300">
                          {member.name
                            .split(/\s+/)
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                          {member.name}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700 dark:border-white/10 dark:text-slate-200">
                        {member.activeWorkOrders}{" "}
                        {member.activeWorkOrders === 1 ? "order" : "orders"}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <Icon className="h-4 w-4 text-sky-500" />
      </div>
      <p className="mt-3 font-mono text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
