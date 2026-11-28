"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HardHat,
  MapPin,
  RotateCcw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../shared/constants/priorities";
import type { TaskStatus } from "../../../../shared/constants/status";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type StaffTask = {
  id: string;
  status: TaskStatus;
  dueAt: string | null;
  reviewNote: string | null;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    category: IssueCategory;
    priority: IssuePriority;
    address: string;
  };
};

type TaskResult = {
  items: StaffTask[];
  page: number;
  total: number;
  totalPages: number;
};

type Tab = "ALL" | TaskStatus;

const PAGE_SIZE = 10;

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "New" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REJECTED", label: "Returned" },
  { key: "COMPLETED", label: "Awaiting Review" },
];

const statusLabel: Record<TaskStatus, string> = {
  PENDING: "New",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Awaiting Review",
  REJECTED: "Returned",
};

const statusStyle: Record<TaskStatus, string> = {
  PENDING:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  IN_PROGRESS:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  COMPLETED:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  REJECTED:
    "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
};

const PRIORITIES: IssuePriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const priorityStyle: Record<IssuePriority, string> = {
  LOW: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  HIGH: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  CRITICAL:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [tab, setTab] = useState<Tab>("ALL");
  const [priority, setPriority] = useState<IssuePriority | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

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
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: "updatedAt:desc",
      });
      if (tab !== "ALL") parameters.set("status", tab);
      if (priority) parameters.set("priority", priority);
      if (query) parameters.set("q", query);

      try {
        const result = await apiClient.get<TaskResult>(
          `/api/tasks?${parameters.toString()}`,
          { signal },
        );
        if (signal.aborted) return;
        setTasks(result.items);
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setNow(Date.now());
      } catch (caught) {
        if (signal.aborted) return;
        setError(
          caught instanceof Error ? caught.message : "Unable to load tasks",
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [page, priority, query, tab],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void load(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load, reloadKey]);

  const hasFilter = query.length > 0 || priority !== "" || tab !== "ALL";

  function clearFilters() {
    setSearch("");
    setQuery("");
    setPriority("");
    setTab("ALL");
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
          Field Crew
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Assigned Tasks
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every work order assigned to you. Open one to update progress.
        </p>
      </header>

      {/* Tabs */}
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Task status"
      >
        {TABS.map((item) => (
          <button
            aria-selected={tab === item.key}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
              tab === item.key
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            }`}
            key={item.key}
            onClick={() => {
              setTab(item.key);
              setPage(1);
            }}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or address..."
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
          aria-label="Filter by priority"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-white/10 dark:bg-slate-900"
          onChange={(event) => {
            setPriority(event.target.value as IssuePriority | "");
            setPage(1);
          }}
          value={priority}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

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
      {error ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">
            {error}
          </p>
          <button
            className="mt-5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            onClick={() => setReloadKey((key) => key + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : loading && tasks.length === 0 ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900"
              key={index}
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/10">
          <HardHat className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            {hasFilter ? "No tasks match your filters" : "No work orders yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasFilter
              ? "Try a different filter or clear them all."
              : "New assignments from your manager will appear here."}
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
        <ul
          className={`mt-5 space-y-3 transition-opacity ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {tasks.map((task) => {
            const overdue =
              task.status !== "COMPLETED" &&
              task.dueAt !== null &&
              new Date(task.dueAt).getTime() < now;

            return (
              <li key={task.id}>
                <Link
                  className={`group block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-sky-400/60 hover:shadow-md dark:bg-slate-900/70 sm:p-5 ${
                    task.status === "REJECTED"
                      ? "border-rose-300 dark:border-rose-900/60"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                  href={`/staff/tasks/${task.id}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Wrench className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                          {task.issue.title}
                        </p>
                        <p className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">
                            {task.issue.address}
                          </span>
                        </p>
                        <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                          {ISSUE_CATEGORY_LABELS[task.issue.category]}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${priorityStyle[task.issue.priority]}`}
                        >
                          {task.issue.priority}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${statusStyle[task.status]}`}
                        >
                          {statusLabel[task.status]}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] ${
                          overdue
                            ? "font-bold text-red-600 dark:text-red-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Clock3 className="h-3 w-3" />
                        {overdue ? "Overdue · " : ""}
                        {formatDate(task.dueAt)}
                      </span>
                    </div>
                  </div>

                  {task.status === "REJECTED" ? (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                      <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-bold">Manager note: </span>
                        {task.reviewNote ?? "No note was provided."}
                      </span>
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page{" "}
            <span className="font-extrabold text-slate-800 dark:text-white">
              {page}
            </span>{" "}
            of {totalPages} · {total} tasks
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
