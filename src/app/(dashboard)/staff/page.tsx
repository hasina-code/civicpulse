"use client";

import {
  AlertCircle,
  ArrowRight,
  Clock3,
  HardHat,
  Hourglass,
  MapPin,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../shared/constants/categories";
import type { IssuePriority } from "../../../shared/constants/priorities";
import type { TaskStatus } from "../../../shared/constants/status";

/* ------------------------------------------------------------------ */
/* Types                                                               */
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

type TaskResult = { items: StaffTask[]; total: number };

type Summary = {
  pending: number;
  inProgress: number;
  awaitingReview: number;
  returned: number;
  overdue: number;
};

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

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

const priorityWeight: Record<IssuePriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const priorityStyle: Record<IssuePriority, string> = {
  LOW: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  HIGH: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  CRITICAL:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

const OPEN_STATUSES = "PENDING,IN_PROGRESS,REJECTED";

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isOverdue(task: StaffTask, now: number) {
  return (
    task.status !== "COMPLETED" &&
    task.dueAt !== null &&
    new Date(task.dueAt).getTime() < now
  );
}

/** Overdue first, then returned work, then by priority, then by due date. */
function attentionOrder(now: number) {
  return (a: StaffTask, b: StaffTask) => {
    const overdueDiff = Number(isOverdue(b, now)) - Number(isOverdue(a, now));
    if (overdueDiff !== 0) return overdueDiff;

    const returnedDiff =
      Number(b.status === "REJECTED") - Number(a.status === "REJECTED");
    if (returnedDiff !== 0) return returnedDiff;

    const priorityDiff =
      priorityWeight[b.issue.priority] - priorityWeight[a.issue.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function StaffDashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, taskResult] = await Promise.all([
        apiClient.get<Summary>("/api/tasks/summary", { signal }),
        apiClient.get<TaskResult>(
          `/api/tasks?status=${OPEN_STATUSES}&limit=30&page=1`,
          { signal },
        ),
      ]);
      if (signal.aborted) return;
      setSummary(summaryResult);
      setTasks(taskResult.items);
      setNow(Date.now());
    } catch (caught) {
      if (signal.aborted) return;
      setError(
        caught instanceof Error ? caught.message : "Unable to load your tasks",
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

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

  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "Crew Member";

  const returnedTasks = tasks.filter((task) => task.status === "REJECTED");
  const priorityTasks = [...tasks].sort(attentionOrder(now)).slice(0, 8);

  const metricCards = summary
    ? [
        {
          label: "New Tasks",
          value: summary.pending,
          hint: "Waiting to be started",
          icon: Clock3,
          tone: "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400",
        },
        {
          label: "In Progress",
          value: summary.inProgress,
          hint: "Work under way",
          icon: Wrench,
          tone: "border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-400",
        },
        {
          label: "Awaiting Review",
          value: summary.awaitingReview,
          hint: "Sent to your manager",
          icon: Hourglass,
          tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "Returned",
          value: summary.returned,
          hint: "Needs correction",
          icon: RotateCcw,
          tone: "border-rose-400/30 bg-rose-400/10 text-rose-600 dark:text-rose-400",
        },
        {
          label: "Overdue",
          value: summary.overdue,
          hint: "Past the due date",
          icon: TriangleAlert,
          tone: "border-red-400/30 bg-red-400/10 text-red-600 dark:text-red-400",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      {/* Header */}
      <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-50/90 via-white to-slate-100/90 p-6 shadow-sm dark:border-sky-400/20 dark:from-[#091526] dark:via-slate-900/90 dark:to-sky-950/55 dark:backdrop-blur-xl sm:p-8 lg:flex-row lg:items-center">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Field Crew
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Staff{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              Overview
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Welcome back, {firstName}. Review your assigned work orders and keep
            field updates moving.
          </p>
        </div>
        <button
          className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300/90 bg-white/80 px-4 text-xs font-bold text-slate-700 transition hover:border-sky-400/50 hover:text-sky-600 disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200"
          disabled={loading}
          onClick={() => setReloadKey((key) => key + 1)}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/50 dark:bg-red-950/20">
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
      ) : loading && !summary ? (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              className="h-32 rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70"
              key={item}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Metrics */}
          <section
            aria-label="Staff task metrics"
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70"
                  key={metric.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {metric.label}
                    </p>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${metric.tone}`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {metric.value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {metric.hint}
                  </p>
                </article>
              );
            })}
          </section>

          {/* Returned work alert */}
          {returnedTasks.length > 0 ? (
            <section className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-sm font-black text-rose-800 dark:text-rose-300">
                  {returnedTasks.length} work order
                  {returnedTasks.length > 1 ? "s were" : " was"} returned for
                  correction
                </h2>
              </div>
              <ul className="mt-3 space-y-3">
                {returnedTasks.slice(0, 3).map((task) => (
                  <li
                    className="rounded-xl border border-rose-200 bg-white p-4 dark:border-rose-900/50 dark:bg-slate-900/70"
                    key={task.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                          {task.issue.title}
                        </p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-rose-700 dark:text-rose-400">
                            Manager note:{" "}
                          </span>
                          {task.reviewNote ?? "No note was provided."}
                        </p>
                      </div>
                      <Link
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white transition hover:bg-rose-700"
                        href={`/staff/tasks/${task.id}`}
                      >
                        Fix now <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Priority work orders */}
          <section className="mt-8">
            <div className="mb-3.5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                  Priority{" "}
                  <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                    Work Orders
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Overdue and returned work first, then by priority
                </p>
              </div>
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                href="/staff/tasks"
              >
                View all tasks <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              {priorityTasks.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5">
                    <HardHat aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                    No open work orders
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    New assignments from your manager will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                  {priorityTasks.map((task) => {
                    const overdue = isOverdue(task, now);
                    return (
                      <li key={task.id}>
                        <Link
                          className="group flex flex-col gap-4 p-4 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                          href={`/staff/tasks/${task.id}`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                              <Wrench aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                                {task.issue.title}
                              </p>
                              <p className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <MapPin
                                  aria-hidden="true"
                                  className="mt-0.5 h-3 w-3 shrink-0"
                                />
                                <span className="line-clamp-1">
                                  {task.issue.address}
                                </span>
                              </p>
                              <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                                {ISSUE_CATEGORY_LABELS[task.issue.category]}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
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
                              <Clock3 aria-hidden="true" className="h-3 w-3" />
                              {overdue ? "Overdue · " : ""}
                              {formatDate(task.dueAt)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
