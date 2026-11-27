"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../shared/constants/priorities";
import type { IssueStatus } from "../../../../shared/constants/status";

type ReportItem = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  address: string;
  createdAt: string;
};

type ReportsResult = {
  items: ReportItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const statusLabels: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const priorityLabels: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const priorityClass: Record<IssuePriority, string> = {
  LOW: "border-slate-300 bg-slate-100 text-slate-700",
  MEDIUM: "border-sky-300 bg-sky-50 text-sky-700",
  HIGH: "border-amber-300 bg-amber-50 text-amber-700",
  CRITICAL: "border-red-300 bg-red-50 text-red-700",
};

const statusClass: Record<IssueStatus, string> = {
  SUBMITTED: "border-slate-300 bg-slate-100 text-slate-700",
  UNDER_REVIEW: "border-sky-300 bg-sky-50 text-sky-700",
  ASSIGNED: "border-indigo-300 bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "border-sky-400 bg-sky-100 text-sky-800",
  RESOLVED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-400 bg-slate-200 text-slate-700",
};

type Tab = "all" | "active" | "resolved";

export default function CitizenReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [priority, setPriority] = useState<IssuePriority | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);
      const parameters = new URLSearchParams({
        limit: "50",
        page: String(page),
        sort: "createdAt:desc",
      });
      if (search.trim()) parameters.set("q", search.trim());
      if (status) parameters.set("status", status);
      if (priority) parameters.set("priority", priority);

      void apiClient
        .get<ReportsResult>(`/api/issues?${parameters.toString()}`)
        .then((result) => {
          setReports(result.items);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Unable to load reports",
          );
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [page, priority, search, status]);

  const filteredReports = useMemo(() => {
    if (tab === "active") {
      return reports.filter((report) =>
        ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"].includes(
          report.status,
        ),
      );
    }
    if (tab === "resolved") {
      return reports.filter((report) =>
        ["RESOLVED", "CLOSED"].includes(report.status),
      );
    }
    return reports;
  }, [reports, tab]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            My Incident Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track and monitor resolution progress for public infrastructure issues.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-300"
          href="/citizen/issues/new"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-950/40 text-base leading-none">
            +
          </span>
          Report Another Issue
        </Link>
      </header>

      <nav className="mt-6 flex border-b border-slate-200 dark:border-white/10">
        {([
          ["all", "All Reports"],
          ["active", "Active Issues"],
          ["resolved", "Resolved"],
        ] as const).map(([value, label]) => (
          <button
            className={`border-b-2 px-5 py-3 text-xs font-black uppercase tracking-wide transition ${
              tab === value
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
            key={value}
            onClick={() => setTab(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-sky-500 dark:border-white/10 dark:bg-slate-950/50"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search by code, title, address, or keyword..."
            value={search}
          />
        </div>
        <span className="hidden whitespace-nowrap text-xs font-semibold text-slate-400 sm:block">
          {total} records
        </span>
        <details className="relative">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900">
            <label className="text-[10px] font-bold uppercase text-slate-500">
              Status
            </label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as IssueStatus | "");
              }}
              value={status}
            >
              <option value="">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-[10px] font-bold uppercase text-slate-500">
              Priority
            </label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
              onChange={(event) => {
                setPage(1);
                setPriority(event.target.value as IssuePriority | "");
              }}
              value={priority}
            >
              <option value="">All priorities</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </details>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              className="h-52 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70"
              key={item}
            />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-16 text-center dark:border-white/10 dark:bg-slate-900/70">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No reports found
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try changing the tab or clearing search and filters.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredReports.map((report) => (
            <article
              className="flex min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70"
              key={report.id}
            >
              <div className="flex items-start justify-end gap-2">
                <span
                  className={`rounded border px-2 py-1 text-[9px] font-bold ${priorityClass[report.priority]}`}
                >
                  {priorityLabels[report.priority]}
                </span>
                <span
                  className={`rounded border px-2 py-1 text-[9px] font-bold ${statusClass[report.status]}`}
                >
                  {statusLabels[report.status]}
                </span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-sm font-black text-slate-900 dark:text-white">
                {report.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {report.description}
              </p>
              <p className="mt-3 flex items-start gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                {report.address}
              </p>
              <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                <div>
                  <p className="text-[9px] text-slate-400">#{report.id}</p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {formatDate(report.createdAt)}
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase text-slate-400">
                    {ISSUE_CATEGORY_LABELS[report.category]}
                  </p>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                  href={`/citizen/issues/${report.id}`}
                >
                  View Details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-white/10"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 dark:border-white/10"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
