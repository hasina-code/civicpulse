
"use client";

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  Zap,
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

type QueueItem = {
  id: string;
  title: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  location: {
    name: string;
    area: string;
    ward: string | null;
  } | null;
};

type QueueResult = {
  items: QueueItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const priorityLabels: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const priorityClass: Record<IssuePriority, string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  CRITICAL: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

const statusLabels: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusClass: Record<IssueStatus, string> = {
  SUBMITTED:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  UNDER_REVIEW:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  ASSIGNED:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300",
  IN_PROGRESS:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
  RESOLVED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  CLOSED:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const activeStatuses: IssueStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getLocation(item: QueueItem) {
  return item.location
    ? `${item.location.area}${
        item.location.ward ? `, Ward ${item.location.ward}` : ""
      }`
    : item.address;
}

export default function DepartmentQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [priority, setPriority] = useState<IssuePriority | "">("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(true);

      const parameters = new URLSearchParams({
        page: String(page),
        limit: "10",
        sort: "createdAt:desc",
      });

      if (search.trim()) parameters.set("q", search.trim());
      if (status) parameters.set("status", status);
      if (priority) parameters.set("priority", priority);
      if (category) parameters.set("category", category);

      void apiClient
        .get<QueueResult>(`/api/issues?${parameters.toString()}`)
        .then((result) => {
          setItems(result.items);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load department queue",
          );
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [category, page, priority, search, status]);

  // Counts from the currently loaded API page.
  const stats = useMemo(() => {
    return {
      pending: items.filter((item) =>
        ["SUBMITTED", "UNDER_REVIEW"].includes(item.status),
      ).length,
      progress: items.filter((item) =>
        ["ASSIGNED", "IN_PROGRESS"].includes(item.status),
      ).length,
      resolved: items.filter((item) =>
        ["RESOLVED", "CLOSED"].includes(item.status),
      ).length,
    };
  }, [items]);

  function exportCsv() {
    if (items.length === 0) {
      toast.error("No records available to export");
      return;
    }

    const rows = [
      [
        "Code",
        "Title",
        "Location",
        "Category",
        "Priority",
        "Status",
        "Reported",
      ],
      ...items.map((item) => [
        item.id.slice(-8).toUpperCase(),
        item.title,
        getLocation(item),
        ISSUE_CATEGORY_LABELS[item.category],
        priorityLabels[item.priority],
        statusLabels[item.status],
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "department-issue-queue.csv";
    anchor.click();

    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setPage(1);
  }

  const activeFilterCount = [
    status,
    priority,
    category,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 dark:bg-[#080f1d] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* Header */}
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                Municipal Administration
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Department Issue Triage Queue
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Review incoming infrastructure reports, monitor priorities,
              and coordinate municipal service operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live API Records
            </div>

            <button
              onClick={exportCsv}
              type="button"
              disabled={loading || items.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white shadow-lg shadow-sky-500/15 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Compact Statistics */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-sky-300 dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Total Submissions
              </p>
              <p className="text-xl font-black tabular-nums">
                {total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-amber-300 dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Pending Review
              </p>
              <p className="text-xl font-black tabular-nums">
                {stats.pending}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                In Progress
              </p>
              <p className="text-xl font-black tabular-nums">
                {stats.progress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Resolved
              </p>
              <p className="text-xl font-black tabular-nums">
                {stats.resolved}
              </p>
            </div>
          </div>

        </section>

        {/* Main Records Panel */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">

          {/* Panel Heading */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-white/10 sm:flex-row sm:items-center sm:px-6">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">
                  Infrastructure Records
                </h2>

                <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 font-mono text-[10px] font-bold text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
                  {total} Total
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Manage and monitor incoming municipal work orders.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <ArrowDownToLine className="h-4 w-4" />
              Latest reports first
            </div>
          </div>

          {/* Search and Filters */}
          <div className="relative z-20 flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:px-6">

            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search by code, title, address..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
                showFilters || activeFilterCount
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(search || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-slate-500 transition hover:text-red-500"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="relative z-10 grid gap-4 border-b border-slate-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-950/20 sm:grid-cols-3 sm:px-6">

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value as IssueStatus | "");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-white/10 dark:bg-slate-900"
                >
                  <option value="">All statuses</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(event) => {
                    setPage(1);
                    setPriority(event.target.value as IssuePriority | "");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-white/10 dark:bg-slate-900"
                >
                  <option value="">All priorities</option>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => {
                    setPage(1);
                    setCategory(event.target.value as IssueCategory | "");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400 dark:border-white/10 dark:bg-slate-900"
                >
                  <option value="">All categories</option>
                  {Object.entries(ISSUE_CATEGORY_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">

              <thead>
                <tr className="h-12 border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
                  <th className="w-28 px-5">Report ID</th>
                  <th className="px-3">Issue Details</th>
                  <th className="w-44 px-3">Category</th>
                  <th className="w-32 px-3">Priority</th>
                  <th className="w-36 px-3">Status</th>
                  <th className="w-44 px-3">Reported Date</th>
                  <th className="w-28 px-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/10">

                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="h-[76px]">
                      <td colSpan={7} className="px-5">
                        <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <AlertCircle className="h-7 w-7" />
                        </div>

                        <h3 className="text-base font-extrabold">
                          No records found
                        </h3>

                        <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500 dark:text-slate-400">
                          No infrastructure reports match your current
                          search or filter criteria.
                        </p>

                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-5 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-600"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="h-[76px] transition hover:bg-sky-50/40 dark:hover:bg-sky-950/10"
                    >
                      <td className="px-5">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          #{item.id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="px-3">
                        <div className="max-w-[290px]">
                          <p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">
                            {item.title}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3 w-3 shrink-0 text-sky-500" />
                            {getLocation(item)}
                          </p>
                        </div>
                      </td>

                      <td className="px-3">
                        <span className="inline-flex max-w-[155px] truncate rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[10px] font-bold text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300">
                          {ISSUE_CATEGORY_LABELS[item.category]}
                        </span>
                      </td>

                      <td className="px-3">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-extrabold ${priorityClass[item.priority]}`}
                        >
                          {priorityLabels[item.priority]}
                        </span>
                      </td>

                      <td className="px-3">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${statusClass[item.status]}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </td>

                      <td className="px-3">
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </td>

                      <td className="px-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            aria-label={`View location for ${item.title}`}
                            title="Pin on map"
                            href={`/map?issueId=${encodeURIComponent(item.id)}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sky-600 transition hover:border-sky-400 hover:bg-sky-50 dark:border-white/10 dark:text-sky-400 dark:hover:bg-sky-950/40"
                          >
                            <MapPin className="h-4 w-4" />
                          </Link>

                          <Link
                            aria-label={`View ${item.title}`}
                            title="View report details"
                            href={`/issues/${item.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 dark:border-white/10 dark:text-slate-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:px-6">

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-extrabold text-slate-800 dark:text-white">
                {items.length}
              </span>{" "}
              records on this page
              {" · "}
              <span className="font-extrabold text-slate-800 dark:text-white">
                {total}
              </span>{" "}
              total records
            </p>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2">

                <button
                  aria-label="Previous page"
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-sky-500 px-3 font-mono text-xs font-extrabold text-white">
                  {page}
                </span>

                <span className="text-xs text-slate-400">
                  of {totalPages}
                </span>

                <button
                  aria-label="Next page"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

              </div>
            )}
          </div>
        </section>

        {/* Footer Note */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
          <Filter className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
            Review incoming reports carefully, prioritize urgent
            infrastructure issues, and coordinate timely municipal
            responses to improve community services.
          </p>
        </div>

      </div>
    </main>
  );
}
