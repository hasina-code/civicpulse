"use client";

import {
  ArrowDown,
  CheckCircle2,
  Clock3,
  HardHat,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../../../client/lib/api-client";
import { ISSUE_CATEGORY_LABELS } from "../../../shared/constants/categories";
import type { IssuePriority } from "../../../shared/constants/priorities";
import type { ManagerOverview } from "../../../shared/types/manager-dashboard";

const priorityStyle: Record<IssuePriority, string> = {
  LOW: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
  MEDIUM:
    "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  HIGH: "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
  CRITICAL:
    "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ManagerDashboardPage() {
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void apiClient
      .get<ManagerOverview>("/api/manager/overview")
      .then((data) => {
        if (active) {
          setOverview(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load department triage data.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refreshOverview = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((key) => key + 1);
  };

  const maxCrewOrders = overview
    ? Math.max(1, ...overview.crew.map((member) => member.activeWorkOrders))
    : 1;

  const metricCards = overview
    ? [
        {
          label: "Pending Triage",
          value: overview.pendingTriage,
          description: "Reports awaiting department review",
          icon: Clock3,
          iconBox:
            "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-400",
          accentLine: "from-amber-400/50",
        },
        {
          label: "Active Work Orders",
          value: overview.activeWorkOrders,
          description: "Pending or in-progress crew tasks",
          icon: HardHat,
          iconBox:
            "border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-400",
          accentLine: "from-sky-400/60",
        },
        {
          label: "Resolved Repairs",
          value: overview.resolvedRepairs,
          description: `${overview.slaComplianceRate.toFixed(1)}% SLA compliant`,
          icon: CheckCircle2,
          iconBox:
            "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
          accentLine: "from-emerald-400/50",
        },
        {
          label: "Active Crew Members",
          value: overview.activeCrewMembers,
          description: "Active staff in this department",
          icon: Users,
          iconBox:
            "border-indigo-400/30 bg-indigo-400/10 text-indigo-600 dark:text-indigo-400",
          accentLine: "from-indigo-400/50",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      {/* হিরো হেডার */}
      {/* হিরো হেডার — Triage Overview কার্ড */}
      <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-50/90 via-white to-slate-100/90 p-6 shadow-sm dark:border-sky-400/20 dark:from-[#091526] dark:via-slate-900/90 dark:to-sky-950/55 dark:backdrop-blur-xl sm:p-8 lg:flex-row lg:items-center">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/15" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            {overview?.departmentName ?? "Department"} Triage &amp; Dispatch
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Triage{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              Overview
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Review incoming citizen reports, monitor repair progress, and keep
            track of your department&apos;s crew workload.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-3">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300/90 bg-white/80 px-4 text-xs font-bold text-slate-700 transition hover:border-sky-400/50 hover:text-sky-600 disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-sky-400/40 dark:hover:text-sky-400"
            disabled={loading}
            onClick={refreshOverview}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-black text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 dark:bg-sky-400 dark:hover:bg-sky-300"
            href="#department-queue"
          >
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
            Open Triage Queue
          </a>
        </div>
      </header>

      {/* এরর ব্যানার */}
      {error ? (
        <div
          aria-live="polite"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p>{error}</p>
          <button
            className="w-fit rounded-lg border border-current px-3 py-1.5 text-xs font-bold transition hover:bg-rose-500/10"
            onClick={refreshOverview}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {/* লোডিং স্কেলেটন */}
      {loading && !overview ? (
        <div
          aria-label="Loading triage overview"
          className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[1, 2, 3, 4].map((item) => (
            <div
              className="h-36 rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70"
              key={item}
            />
          ))}
        </div>
      ) : overview ? (
        <>
          {/* ম্যাট্রিক কার্ড গ্রিড */}
          <section
            aria-label="Department triage metrics"
            className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl"
                  key={metric.label}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${metric.accentLine} to-transparent`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {metric.label}
                    </p>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${metric.iconBox}`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {metric.value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {metric.description}
                  </p>
                </article>
              );
            })}
          </section>

          {/* ট্রায়াজ কিউ ও ক্রু ওয়ার্কলোড */}
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <section id="department-queue" className="scroll-mt-24">
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                    Incidents Awaiting Department{" "}
                    <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                      Triage
                    </span>
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Latest reports submitted to {overview.departmentName}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300">
                  {overview.pendingTriage.toLocaleString()} pending
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
                {overview.queue.length === 0 ? (
                  <p className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No reports are waiting for triage in this department.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                    {overview.queue.map((issue) => (
                      <li
                        className="flex flex-col gap-3 p-4 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                        key={issue.id}
                      >
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {issue.title}
                          </h3>
                          <p className="mt-1 font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                            {ISSUE_CATEGORY_LABELS[issue.category]}
                            <span className="mx-1.5 text-slate-400">·</span>
                            <span className="font-sans font-normal text-slate-500 dark:text-slate-400">
                              {issue.location
                                ? `${issue.location.area}${issue.location.ward ? `, Ward ${issue.location.ward}` : ""}`
                                : issue.address}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin
                                aria-hidden="true"
                                className="h-3 w-3 shrink-0 text-sky-500 dark:text-sky-400"
                              />
                              <span className="truncate">{issue.address}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                              <Clock3
                                aria-hidden="true"
                                className="h-3 w-3 shrink-0 text-slate-400"
                              />
                              {formatDate(issue.createdAt)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`w-fit shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${priorityStyle[issue.priority]}`}
                        >
                          {issue.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section id="crew-workload" className="scroll-mt-24">
              <div className="mb-3.5">
                <h2 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                  Field Crew{" "}
                  <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                    Workload
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Active work orders assigned to department staff
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
                {overview.crew.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No active staff members are assigned to this department.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                    {overview.crew.map((member) => {
                      const loadPercent = Math.min(
                        100,
                        Math.round(
                          (member.activeWorkOrders / maxCrewOrders) * 100,
                        ),
                      );
                      return (
                        <li
                          className="space-y-2.5 p-4 transition hover:bg-slate-50/80 dark:hover:bg-white/[0.02] sm:p-5"
                          key={member.id}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 font-mono text-xs font-bold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
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

                            <span className="shrink-0 rounded-full border border-white/10 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">
                              {member.activeWorkOrders}{" "}
                              {member.activeWorkOrders === 1
                                ? "order"
                                : "orders"}
                            </span>
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300"
                              style={{ width: `${loadPercent}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}