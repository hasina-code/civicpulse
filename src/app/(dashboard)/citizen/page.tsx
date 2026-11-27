"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Plus,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../shared/constants/categories";

type IssueStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type IssueItem = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  resolvedAt: string | null;
  department: { name: string } | null;
};

type IssuesResult = {
  items: IssueItem[];
  total: number;
};

const ACTIVE_STATUSES = new Set<IssueStatus>([
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
]);

const statusStyle: Record<IssueStatus, string> = {
  SUBMITTED:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
  UNDER_REVIEW:
    "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
  ASSIGNED:
    "border-sky-400/40 bg-sky-500/15 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/15 dark:text-sky-300",
  IN_PROGRESS:
    "border-sky-400/50 bg-sky-400/15 text-sky-700 dark:border-sky-400/50 dark:bg-sky-400/15 dark:text-sky-200",
  RESOLVED:
    "border-emerald-400/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-300",
  CLOSED:
    "border-emerald-400/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-300",
};

const categoryStyle: Record<IssueCategory, string> = {
  ROAD_DAMAGE:
    "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  STREETLIGHT:
    "bg-sky-400/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  DRAINAGE:
    "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
  FOOTPATH:
    "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  WASTE_MANAGEMENT:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  PUBLIC_INFRASTRUCTURE:
    "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
};

function statusLabel(status: IssueStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CitizenDashboardPage() {
  const { data: session } = useSession();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void apiClient
      .get<IssuesResult>("/api/issues?limit=50&sort=createdAt:desc")
      .then((result) => {
        setIssues(result.items);
        setTotal(result.total);
      })
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load reports",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;
    const activeIssues = issues.filter((issue) =>
      ACTIVE_STATUSES.has(issue.status),
    );
    const resolvedIssues = issues.filter(
      (issue) =>
        (issue.status === "RESOLVED" || issue.status === "CLOSED") &&
        issue.resolvedAt,
    );
    const recentActive = issues.filter(
      (issue) =>
        ACTIVE_STATUSES.has(issue.status) &&
        now - new Date(issue.createdAt).getTime() <= sevenDays,
    ).length;
    const previousActive = issues.filter(
      (issue) =>
        ACTIVE_STATUSES.has(issue.status) &&
        now - new Date(issue.createdAt).getTime() > sevenDays &&
        now - new Date(issue.createdAt).getTime() <= sevenDays * 2,
    ).length;
    const recentResolved = issues.filter(
      (issue) =>
        (issue.status === "RESOLVED" || issue.status === "CLOSED") &&
        issue.resolvedAt &&
        now - new Date(issue.resolvedAt).getTime() <= month,
    ).length;
    const previousResolved = issues.filter(
      (issue) =>
        (issue.status === "RESOLVED" || issue.status === "CLOSED") &&
        issue.resolvedAt &&
        now - new Date(issue.resolvedAt).getTime() > month &&
        now - new Date(issue.resolvedAt).getTime() <= month * 2,
    ).length;
    const responseHours = resolvedIssues.map(
      (issue) =>
        (new Date(issue.resolvedAt as string).getTime() -
          new Date(issue.createdAt).getTime()) /
        (60 * 60 * 1000),
    );
    const averageResponse =
      responseHours.length > 0
        ? responseHours.reduce((sum, hours) => sum + hours, 0) /
          responseHours.length
        : 0;

    return {
      active: activeIssues.length,
      resolved: resolvedIssues.length,
      averageResponse,
      recentActive,
      previousActive,
      recentResolved,
      previousResolved,
    };
  }, [issues, now]);

  const firstName =
    session?.user?.name?.trim().split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "Citizen";

  const dhakaIssues = issues.filter(
    (issue) =>
      Number.isFinite(issue.latitude) &&
      Number.isFinite(issue.longitude) &&
      issue.latitude >= 23.65 &&
      issue.latitude <= 23.95 &&
      issue.longitude >= 90.28 &&
      issue.longitude <= 90.58,
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
            Citizen Action Hub
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            Welcome back,{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              {firstName}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor your municipal reports and the latest city response updates.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/15 transition hover:bg-sky-400 dark:bg-sky-400 dark:hover:bg-sky-300"
          href="/citizen/issues/new"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Report New Issue
        </Link>
      </header>

      {loading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70"
              key={item}
            />
          ))}
        </div>
      ) : (
        <>
          <section
            aria-label="Citizen report summary"
            className="mt-8 grid gap-4 md:grid-cols-3"
          >
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Active Municipal Issues
                </p>
                <Clock3
                  aria-hidden="true"
                  className="h-5 w-5 text-sky-600 dark:text-sky-400"
                />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {metrics.active}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span
                  className={
                    metrics.recentActive >= metrics.previousActive
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-slate-500"
                  }
                >
                  {metrics.recentActive >= metrics.previousActive ? "+" : ""}
                  {metrics.recentActive - metrics.previousActive}
                </span>{" "}
                vs previous 7 days
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Resolved Reports
                </p>
                <CheckCircle2
                  aria-hidden="true"
                  className="h-5 w-5 text-sky-600 dark:text-sky-400"
                />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {metrics.resolved}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span
                  className={
                    metrics.recentResolved >= metrics.previousResolved
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-slate-500"
                  }
                >
                  {metrics.recentResolved >= metrics.previousResolved ? "+" : ""}
                  {metrics.recentResolved - metrics.previousResolved}
                </span>{" "}
                vs previous 30 days
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Average Response
                </p>
                <Radio
                  aria-hidden="true"
                  className="h-5 w-5 text-sky-600 dark:text-sky-400"
                />
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                {metrics.averageResponse > 0
                  ? `${metrics.averageResponse.toFixed(1)} hrs`
                  : "N/A"}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Based on {metrics.resolved} resolved report
                {metrics.resolved === 1 ? "" : "s"}
              </p>
            </article>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Infrastructure Reports
                </h2>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                  href="/citizen/issues"
                >
                  View All <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </Link>
              </header>
              {issues.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  You have not reported any issues yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {issues.slice(0, 5).map((issue) => (
                    <Link
                      className="block px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      href={`/citizen/issues/${issue.id}`}
                      key={issue.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${categoryStyle[issue.category]}`}
                          >
                            {ISSUE_CATEGORY_LABELS[issue.category]}
                          </span>
                          <h3 className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-white">
                            {issue.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin aria-hidden="true" className="h-3 w-3" />
                            {issue.address}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex rounded border px-2 py-1 text-[9px] font-bold ${statusStyle[issue.status]}`}
                          >
                            {statusLabel(issue.status)}
                          </span>
                          <p className="mt-2 text-[9px] text-slate-400">
                            {formatDateTime(issue.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  City Incident Radar
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-sky-600 dark:text-sky-400">
                  Live Geo-Pins
                </p>
              </header>
              <div className="relative h-[390px] overflow-hidden bg-slate-900">
                <iframe
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=90.28%2C23.65%2C90.58%2C23.95&amp;layer=mapnik"
                  title="Dhaka city incident map"
                />
                {dhakaIssues.slice(0, 12).map((issue) => {
                  const left =
                    ((issue.longitude - 90.28) / (90.58 - 90.28)) * 100;
                  const top =
                    (1 - (issue.latitude - 23.65) / (23.95 - 23.65)) * 100;
                  return (
                    <span
                      aria-label={`${issue.title}, ${statusLabel(issue.status)}`}
                      className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ${
                        ACTIVE_STATUSES.has(issue.status)
                          ? "bg-sky-400"
                          : "bg-emerald-500"
                      }`}
                      key={issue.id}
                      style={{
                        left: `${Math.min(96, Math.max(4, left))}%`,
                        top: `${Math.min(94, Math.max(6, top))}%`,
                      }}
                      title={issue.title}
                    />
                  );
                })}
              </div>
              <footer className="flex items-center justify-between px-5 py-3 text-[10px] text-slate-500 dark:text-slate-400">
                <span>{dhakaIssues.length} geo-pinned reports</span>
                <span>{total} total reports</span>
              </footer>
            </article>
          </section>
        </>
      )}
    </div>
  );
}