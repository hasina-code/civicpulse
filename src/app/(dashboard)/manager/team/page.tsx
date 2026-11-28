"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  Phone,
  Search,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type CrewMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  departmentId: string | null;
  workload: {
    active: number; // ASSIGNED + IN_PROGRESS tasks
    completed: number; // finished tasks
    overdue: number; // active tasks past dueAt
  };
};

type CrewResult = {
  items: CrewMember[];
  page: number;
  total: number;
  totalPages: number;
  department?: { id: string; name: string } | null;
};

type SortOption = "workload:asc" | "workload:desc" | "name:asc";
type LoadLevel = "inactive" | "available" | "busy" | "overloaded";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 12;

// Active tasks a crew member can reasonably carry at once.
// Later this can come from the admin "Dispatch" system setting.
const MAX_ACTIVE_TASKS = 5;

const SORT_LABELS: Record<SortOption, string> = {
  "workload:asc": "Lightest workload first",
  "workload:desc": "Heaviest workload first",
  "name:asc": "Name (A–Z)",
};

const LEVEL_META: Record<
  LoadLevel,
  { label: string; badge: string; bar: string }
> = {
  inactive: {
    label: "Inactive",
    badge:
      "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    bar: "bg-slate-400",
  },
  available: {
    label: "Available",
    badge:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  busy: {
    label: "Busy",
    badge:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  overloaded: {
    label: "Overloaded",
    badge:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    bar: "bg-red-500",
  },
};

function getLoadLevel(member: CrewMember): LoadLevel {
  if (!member.isActive) return "inactive";
  const ratio = member.workload.active / MAX_ACTIVE_TASKS;
  if (ratio >= 0.8) return "overloaded";
  if (ratio >= 0.4) return "busy";
  return "available";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* Page */


export default function ManagerCrewWorkloadPage() {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [department, setDepartment] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("workload:asc");
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounced search.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      const parameters = new URLSearchParams({
        role: "STAFF",
        withWorkload: "true",
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (query) parameters.set("q", query);
      if (activeOnly) parameters.set("isActive", "true");

      try {
        const result = await apiClient.get<CrewResult>(
          `/api/users?${parameters.toString()}`,
          { signal },
        );
        if (signal.aborted) return;

        if (result.items.length === 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
          return;
        }

        setMembers(result.items);
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setDepartment(result.department?.name ?? null);
      } catch (caught) {
        if (signal.aborted) return;
        const message =
          caught instanceof Error ? caught.message : "Unable to load the crew";
        setError(message);
        toast.error(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [activeOnly, page, query, sort],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  // Summary for the members currently loaded on this page.
  const pageSummary = members.reduce(
    (totals, member) => ({
      open: totals.open + member.workload.active,
      overdue: totals.overdue + member.workload.overdue,
      available:
        totals.available + (getLoadLevel(member) === "available" ? 1 : 0),
    }),
    { open: 0, overdue: 0, available: 0 },
  );

  const hasFilter = query.length > 0 || activeOnly;

  function clearFilters() {
    setSearch("");
    setQuery("");
    setActiveOnly(false);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      {/* Header */}
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
          Department Operations
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Field Crew &amp; Workload
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {department
            ? `Maintenance staff of ${department}. `
            : "Maintenance staff of your department. "}
          Check who has capacity before assigning new work orders.
        </p>
      </header>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Crew Members" value={total} />
        <Stat
          icon={UserCheck}
          label="Available (this page)"
          tone="emerald"
          value={pageSummary.available}
        />
        <Stat
          icon={Wrench}
          label="Open Work Orders"
          tone="sky"
          value={pageSummary.open}
        />
        <Stat
          icon={AlertTriangle}
          label="Overdue Tasks"
          tone={pageSummary.overdue > 0 ? "red" : "slate"}
          value={pageSummary.overdue}
        />
      </section>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or phone..."
            value={search}
          />
          {search ? (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
              onClick={() => setSearch("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <select
          aria-label="Sort crew"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-white/10 dark:bg-slate-900"
          onChange={(event) => {
            setSort(event.target.value as SortOption);
            setPage(1);
          }}
          value={sort}
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>

        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
          <input
            checked={activeOnly}
            className="h-4 w-4 accent-sky-500"
            onChange={(event) => {
              setActiveOnly(event.target.checked);
              setPage(1);
            }}
            type="checkbox"
          />
          Active staff only
        </label>

        {hasFilter ? (
          <button
            className="text-xs font-bold text-slate-500 transition hover:text-red-500"
            onClick={clearFilters}
            type="button"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Content */}
      {loading && members.length === 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900"
              key={index}
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">
            {error}
          </p>
          <button
            className="mt-5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            onClick={() => setReloadKey((current) => current + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/10">
          <Users className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            {hasFilter
              ? "No crew members match your filters"
              : "No maintenance staff in your department yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasFilter
              ? "Try a different keyword or clear the filters."
              : "An administrator can add staff from the Users page."}
          </p>
          {hasFilter ? (
            <button
              className="mt-5 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-600"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div
          className={`mt-5 grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3 ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {members.map((member) => (
            <CrewCard key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page{" "}
            <span className="font-extrabold text-slate-800 dark:text-white">
              {page}
            </span>{" "}
            of {totalPages} · {total} crew members
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* Crew card */


function CrewCard({ member }: { member: CrewMember }) {
  const level = getLoadLevel(member);
  const meta = LEVEL_META[level];
  const { active, completed, overdue } = member.workload;
  const percent = Math.min(100, Math.round((active / MAX_ACTIVE_TASKS) * 100));

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900/70 ${
        overdue > 0
          ? "border-red-200 dark:border-red-900/60"
          : "border-slate-200 dark:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-mono text-sm font-black text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">
              {member.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.email}</span>
            </p>
            {member.phone ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Phone className="h-3 w-3 shrink-0" />
                {member.phone}
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            Workload
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
            {active} / {MAX_ACTIVE_TASKS} active
          </span>
        </div>
        <div
          aria-label={`${percent}% of capacity`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
        >
          <div
            className={`h-full rounded-full transition-all ${meta.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Counters */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
        <Counter
          icon={Clock3}
          label="Active"
          tone="text-sky-600 dark:text-sky-400"
          value={active}
        />
        <Counter
          icon={CheckCircle2}
          label="Completed"
          tone="text-emerald-600 dark:text-emerald-400"
          value={completed}
        />
        <Counter
          icon={AlertTriangle}
          label="Overdue"
          tone={
            overdue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-slate-400 dark:text-slate-500"
          }
          value={overdue}
        />
      </div>
    </article>
  );
}

function Counter({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="text-center">
      <Icon className={`mx-auto h-4 w-4 ${tone}`} />
      <p className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* Stat card  */


const STAT_TONES = {
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  slate: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
} as const;

function Stat({
  icon: Icon,
  label,
  value,
  tone = "sky",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 font-mono text-2xl font-black tabular-nums text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
