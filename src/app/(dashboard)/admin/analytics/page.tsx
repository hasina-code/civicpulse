"use client";

import { AlertCircle, BarChart3, Building2, RefreshCw, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../../client/lib/api-client";
import { ISSUE_CATEGORY_LABELS, ISSUE_CATEGORIES, type IssueCategory } from "../../../../shared/constants/categories";
import { ISSUE_STATUSES, type IssueStatus } from "../../../../shared/constants/status";

type Summary = {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  byStatus: Record<IssueStatus, number>;
  byCategory: Record<IssueCategory, number>;
  slaComplianceRate: number;
};

type Trend = { period: string; total: number; byStatus: Record<IssueStatus, number> };
type Department = { id: string; name: string; total: number; byStatus: Record<IssueStatus, number> };
type Satisfaction = { averageRating: number; totalFeedback: number; byRating: { rating: number; count: number }[] };

const STATUS_TONES: Record<IssueStatus, string> = {
  SUBMITTED: "bg-amber-500",
  UNDER_REVIEW: "bg-orange-500",
  ASSIGNED: "bg-indigo-500",
  IN_PROGRESS: "bg-sky-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-400",
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

type AnalyticsData = { summary: Summary; trends: Trend[]; departments: Department[]; satisfaction: Satisfaction };

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [summary, trends, departments, satisfaction] = await Promise.all([
        apiClient.get<Summary>("/api/analytics/summary", { signal }),
        apiClient.get<Trend[]>("/api/analytics/trends?interval=month", { signal }),
        apiClient.get<Department[]>("/api/analytics/departments", { signal }),
        apiClient.get<Satisfaction>("/api/analytics/satisfaction", { signal }),
      ]);
      if (!signal.aborted) setData({ summary, trends, departments, satisfaction });
    } catch (caught) {
      if (!signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load analytics");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load, reloadKey]);

  const maxTrend = Math.max(1, ...(data?.trends.map((item) => item.total) ?? []));
  const maxDepartment = Math.max(1, ...(data?.departments.map((item) => item.total) ?? []));

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Citywide insights</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Analytics &amp; Performance</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Issue trends, department performance, service levels, and citizen feedback.</p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" disabled={loading} onClick={() => setReloadKey((key) => key + 1)} type="button"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </header>

      {error ? <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" role="alert"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span><button className="text-xs font-bold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Retry</button></div> : null}
      {loading && !data ? <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" key={item} />)}</div> : null}

      {data ? <>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="All reports" value={data.summary.totalIssues} detail="Citywide reports received" icon={BarChart3} />
          <Metric label="Open reports" value={data.summary.openIssues} detail="Awaiting or in active service" icon={Building2} />
          <Metric label="SLA compliance" value={`${data.summary.slaComplianceRate.toFixed(1)}%`} detail="Resolved within target time" icon={BarChart3} />
          <Metric label="Citizen rating" value={data.satisfaction.averageRating.toFixed(1)} detail={`${data.satisfaction.totalFeedback} submitted ratings`} icon={Star} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex items-start justify-between"><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Report volume</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monthly reports over the last year</p></div><BarChart3 className="h-5 w-5 text-sky-500" /></div>
            {data.trends.length ? <div className="mt-6 flex h-52 items-end gap-2 overflow-x-auto border-b border-l border-slate-200 px-2 dark:border-white/10">
              {data.trends.map((item) => <div className="group flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2" key={item.period} title={`${item.period}: ${item.total} reports`}>
                <span className="text-[9px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">{item.total}</span>
                <div className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md bg-slate-100 dark:bg-slate-800" style={{ height: `${Math.max(3, (item.total / maxTrend) * 78)}%` }}>
                  {ISSUE_STATUSES.map((status) => item.byStatus[status] ? <div className={STATUS_TONES[status]} key={status} style={{ height: `${(item.byStatus[status] / item.total) * 100}%`, minHeight: 2 }} /> : null)}
                </div>
                <span className="mb-1 text-[9px] text-slate-400">{item.period.slice(5)}</span>
              </div>)}
            </div> : <p className="py-16 text-center text-sm text-slate-500">No trend data in the selected period.</p>}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{ISSUE_STATUSES.map((status) => <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400" key={status}><span className={`h-2 w-2 rounded-full ${STATUS_TONES[status]}`} />{STATUS_LABELS[status]}</span>)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Reports by status</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current citywide workflow distribution</p>
            <div className="mt-5 space-y-3">{ISSUE_STATUSES.map((status) => {
              const count = data.summary.byStatus[status];
              const percent = data.summary.totalIssues ? Math.round((count / data.summary.totalIssues) * 100) : 0;
              return <div key={status}><div className="mb-1 flex justify-between text-xs"><span className="text-slate-600 dark:text-slate-300">{STATUS_LABELS[status]}</span><span className="font-mono font-bold text-slate-700 dark:text-white">{count} <span className="font-normal text-slate-400">({percent}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${STATUS_TONES[status]}`} style={{ width: `${percent}%` }} /></div></div>;
            })}</div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Department workload</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Reports assigned across active departments</p>
            <div className="mt-5 space-y-4">{data.departments.map((department) => <div key={department.id}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-700 dark:text-slate-200">{department.name}</span><span className="font-mono font-bold text-slate-600 dark:text-slate-300">{department.total}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-sky-500" style={{ width: `${(department.total / maxDepartment) * 100}%` }} /></div></div>)}</div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Issue categories</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Most common civic service requests</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{ISSUE_CATEGORIES.map((category) => {
              const count = data.summary.byCategory[category];
              const percent = data.summary.totalIssues ? Math.round((count / data.summary.totalIssues) * 100) : 0;
              return <div className="rounded-xl border border-slate-100 p-3 dark:border-white/10" key={category}><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{ISSUE_CATEGORY_LABELS[category]}</span><span className="font-mono text-xs font-bold text-slate-800 dark:text-white">{count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} /></div></div>;
            })}</div>
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/10"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-700 dark:text-slate-200">Feedback received</span><span className="font-mono text-slate-500">{data.satisfaction.totalFeedback}</span></div><div className="mt-3 flex items-center gap-2">{[1, 2, 3, 4, 5].map((rating) => {
              const count = data.satisfaction.byRating.find((entry) => entry.rating === rating)?.count ?? 0;
              const percent = data.satisfaction.totalFeedback ? (count / data.satisfaction.totalFeedback) * 100 : 0;
              return <div className="flex flex-1 flex-col items-center gap-1" key={rating}><div className="flex h-14 w-full items-end rounded bg-slate-100 dark:bg-slate-800"><div className="w-full rounded bg-amber-400" style={{ height: `${Math.max(count ? 5 : 0, percent)}%` }} /></div><span className="text-[10px] text-slate-400">{rating}★</span></div>;
            })}</div></div>
          </section>
        </div>
      </> : null}
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof BarChart3 }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"><div className="flex items-start justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{value}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p></article>;
}
