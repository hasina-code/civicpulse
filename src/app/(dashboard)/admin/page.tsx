"use client";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../client/lib/api-client";
import { ISSUE_STATUSES, type IssueStatus } from "../../../shared/constants/status";
import type { IssuePriority } from "../../../shared/constants/priorities";

type Summary = {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  byStatus: Record<IssueStatus, number>;
  byCategory: Record<string, number>;
  slaComplianceRate: number;
};

type Department = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { members: number; issues: number };
};

type Issue = {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  address: string;
  createdAt: string;
  department: { name: string };
};

type Overview = {
  summary: Summary;
  departments: Department[];
  recentIssues: Issue[];
  users: number;
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_TONES: Record<IssueStatus, string> = {
  SUBMITTED: "bg-amber-500",
  UNDER_REVIEW: "bg-orange-500",
  ASSIGNED: "bg-indigo-500",
  IN_PROGRESS: "bg-sky-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-400",
};

const PRIORITY_TONES: Record<IssuePriority, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-sky-600 dark:text-sky-400",
  HIGH: "text-amber-600 dark:text-amber-400",
  CRITICAL: "text-rose-600 dark:text-rose-400",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [summary, departments, issues, users] = await Promise.all([
        apiClient.get<Summary>("/api/analytics/summary", { signal }),
        apiClient.get<Department[]>("/api/departments", { signal }),
        apiClient.get<{ items: Issue[] }>("/api/issues?page=1&limit=6&sort=createdAt:desc", { signal }),
        apiClient.get<{ total: number }>("/api/users?page=1&limit=1", { signal }),
      ]);
      if (signal.aborted) return;
      setData({
        summary,
        departments,
        recentIssues: issues.items,
        users: users.total,
      });
    } catch (caught) {
      if (signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "Unable to load administration data");
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
  }, [load, refreshKey]);

  const metrics = data
    ? [
        { label: "Total reports", value: data.summary.totalIssues, detail: "All citizen-submitted issues", icon: FileText, tone: "text-sky-600 bg-sky-500/10" },
        { label: "Open reports", value: data.summary.openIssues, detail: "Needs attention or active work", icon: Clock3, tone: "text-amber-600 bg-amber-500/10" },
        { label: "Resolved", value: data.summary.resolvedIssues, detail: `${data.summary.slaComplianceRate.toFixed(1)}% within SLA`, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10" },
        { label: "People & teams", value: data.users, detail: `${data.departments.filter((department) => department.isActive).length} active departments`, icon: Users, tone: "text-indigo-600 bg-indigo-500/10" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-50 via-white to-slate-100 p-6 shadow-sm dark:border-sky-400/20 dark:from-[#091526] dark:via-slate-900 dark:to-sky-950/50 sm:flex-row sm:items-center sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">City Administration</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Admin <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">Overview</span></h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Monitor city services, review civic reports, and manage the teams and systems behind CivicPulse.</p>
        </div>
        <button className="relative inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 text-xs font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200" disabled={loading} onClick={() => setRefreshKey((key) => key + 1)} type="button">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      {error ? (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
          <button className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-xs font-bold" onClick={() => setRefreshKey((key) => key + 1)} type="button">Retry</button>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" key={item} />)}</div>
      ) : data ? (
        <>
          <section aria-label="Administration metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70" key={metric.label}>
                <div className="flex items-start justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{metric.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><Icon className="h-4 w-4" /></span></div>
                <p className="mt-3 font-mono text-3xl font-black text-slate-900 dark:text-white">{metric.value.toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p>
              </article>;
            })}
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div><h2 className="text-sm font-black text-slate-900 dark:text-white">Recent civic reports</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest activity across the city</p></div>
                <Link className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400" href="/issues">View issues <ArrowRight className="inline h-3.5 w-3.5" /></Link>
              </div>
              {data.recentIssues.length ? <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {data.recentIssues.map((issue) => <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={issue.id}>
                  <div className="min-w-0"><Link className="truncate text-sm font-bold text-slate-800 hover:text-sky-600 dark:text-slate-100 dark:hover:text-sky-400" href={`/issues/${issue.id}`}>{issue.title}</Link><p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{issue.department.name} · {issue.address}</p></div>
                  <div className="flex shrink-0 items-center gap-3"><span className={`text-[10px] font-extrabold uppercase ${PRIORITY_TONES[issue.priority]}`}>{issue.priority}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">{STATUS_LABELS[issue.status]}</span></div>
                </li>)}
              </ul> : <p className="px-5 py-12 text-center text-sm text-slate-500">No reports have been submitted yet.</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Report status</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Citywide work distribution</p></div><ShieldCheck className="h-5 w-5 text-sky-500" /></div>
              <div className="mt-5 space-y-3">{ISSUE_STATUSES.map((status) => {
                const count = data.summary.byStatus[status];
                const percent = data.summary.totalIssues ? Math.round((count / data.summary.totalIssues) * 100) : 0;
                return <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-600 dark:text-slate-300">{STATUS_LABELS[status]}</span><span className="font-mono font-bold text-slate-800 dark:text-white">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${STATUS_TONES[status]}`} style={{ width: `${percent}%` }} /></div></div>;
              })}</div>
            </section>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-black text-slate-900 dark:text-white">Departments</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Service teams and citywide report counts</p></div><Link className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400" href="/admin/departments">Manage departments <ArrowRight className="h-3.5 w-3.5" /></Link></div>
            {data.departments.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{data.departments.slice(0, 6).map((department) => <article className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70" key={department.id}><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Building2 className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-white">{department.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{department._count.members} members · {department._count.issues} reports</p></div></div><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${department.isActive ? "bg-emerald-500" : "bg-slate-400"}`} title={department.isActive ? "Active" : "Inactive"} /></article>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10">No departments yet.</p>}
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{ label: "Analytics", href: "/admin/analytics", icon: FileText, text: "Explore citywide trends" }, { label: "Departments", href: "/admin/departments", icon: Building2, text: "Manage service teams" }, { label: "Users", href: "/admin/users", icon: Users, text: "Manage access and roles" }, { label: "System settings", href: "/admin/system", icon: ShieldCheck, text: "Configure service policies" }].map((item) => {
              const Icon = item.icon;
              return <Link className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-400 hover:shadow-sm dark:border-white/10 dark:bg-slate-900/70" href={item.href} key={item.label}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-bold text-slate-800 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">{item.label}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.text}</span></span><ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-500" /></Link>;
            })}
          </section>
        </>
      ) : null}
    </div>
  );
}
