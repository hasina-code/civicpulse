"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  History,
  Layers,
  MapPin,
  Maximize2,
  ShieldAlert,
  Star,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../shared/constants/priorities";
import type { IssueStatus } from "../../../../shared/constants/status";

/* Types */


type Role = "ADMIN" | "MANAGER" | "STAFF" | "CITIZEN";

type IssueDetail = {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  address: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  createdAt: string;
  resolvedAt: string | null;
  duplicateOfId?: string | null;
  department?: { id: string; name: string } | null;
  reporter?: { id: string; name: string } | null;
  task?: {
    id: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    dueAt: string | null;
    completionPhotoUrls: string[];
    reviewNote: string | null;
    assignee: { id: string; name: string } | null;
  } | null;
  feedback?: { rating: number; comment: string | null } | null;
};

type HistoryEntry = {
  id: string;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus;
  note: string | null;
  createdAt: string;
  actor: { name: string; role: Role } | null;
};

type StaffOption = { id: string; name: string };

/* Constants */


const STAGES: { key: IssueStatus; title: string; hint: string }[] = [
  { key: "SUBMITTED", title: "Report Logged", hint: "Received by municipal intake" },
  { key: "UNDER_REVIEW", title: "Triage & Verification", hint: "Inspector validating location" },
  { key: "ASSIGNED", title: "Crew Dispatched", hint: "Routed to field engineering unit" },
  { key: "IN_PROGRESS", title: "Repair Active", hint: "On-site restoration underway" },
  { key: "RESOLVED", title: "Resolved & Verified", hint: "Infrastructure restored" },
];

const PRIORITIES: IssuePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const priorityMeta: Record<
  IssuePriority,
  { label: string; dot: string; badge: string }
> = {
  LOW: {
    label: "Low Severity",
    dot: "bg-slate-400",
    badge: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  },
  MEDIUM: {
    label: "Medium Severity",
    dot: "bg-sky-400",
    badge: "border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-300",
  },
  HIGH: {
    label: "High Severity",
    dot: "bg-amber-400",
    badge: "border-amber-400/35 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  },
  CRITICAL: {
    label: "Critical Hazard",
    dot: "bg-rose-400",
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
};

const statusMeta: Record<IssueStatus, string> = {
  SUBMITTED: "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200",
  UNDER_REVIEW: "border-sky-400/35 bg-sky-400/10 text-sky-700 dark:text-sky-300",
  ASSIGNED: "border-indigo-400/35 bg-indigo-400/10 text-indigo-700 dark:text-indigo-300",
  IN_PROGRESS: "border-sky-400/55 bg-sky-400/15 text-sky-800 dark:text-sky-200",
  RESOLVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  CLOSED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
};

const BACK_LINKS: Record<Role, { href: string; label: string }> = {
  CITIZEN: { href: "/citizen/issues", label: "Back to My Reports" },
  MANAGER: { href: "/manager/department-queue", label: "Back to Triage Queue" },
  STAFF: { href: "/staff", label: "Back to My Work Orders" },
  ADMIN: { href: "/admin", label: "Back to City Overview" },
};

const cardClass =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl";
const labelClass =
  "font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400";
const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900";
const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white shadow-lg shadow-sky-500/15 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: IssueStatus) {
  return status.replaceAll("_", " ");
}

/* Page */

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "CITIZEN") as Role;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [detail, timeline] = await Promise.all([
        apiClient.get<IssueDetail>(`/api/issues/${id}`),
        apiClient.get<HistoryEntry[]>(`/api/issues/${id}/history`),
      ]);
      setIssue(detail);
      setHistory(timeline);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load the report",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      apiClient.get<IssueDetail>(`/api/issues/${id}`),
      apiClient.get<HistoryEntry[]>(`/api/issues/${id}/history`),
    ])
      .then(([detail, timeline]) => {
        if (!active) return;
        setIssue(detail);
        setHistory(timeline);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Unable to load the report",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  const currentStageIndex = useMemo(() => {
    if (!issue) return 0;
    if (issue.status === "CLOSED") return STAGES.length - 1;
    const found = STAGES.findIndex((stage) => stage.key === issue.status);
    return found >= 0 ? found : 0;
  }, [issue]);

  const back = BACK_LINKS[role];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          <div className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/60" />
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/60" />
            <div className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-sky-600 transition hover:border-sky-400/40 hover:bg-sky-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-sky-400"
          href={back.href}
        >
          <ArrowLeft className="h-4 w-4" />
          {back.label}
        </Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center dark:border-white/10 dark:bg-slate-900/70">
          <p className="text-base font-bold text-slate-900 dark:text-white">
            Report not available
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {loadError ??
              "The report may have been removed, or you do not have access to it."}
          </p>
          <button
            className={`${primaryButton} mt-6`}
            onClick={() => {
              setLoading(true);
              void load();
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasValidCoords =
    Number.isFinite(issue.latitude) && Number.isFinite(issue.longitude);

  const mapEmbedUrl = hasValidCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${issue.longitude - 0.007}%2C${issue.latitude - 0.007}%2C${issue.longitude + 0.007}%2C${issue.latitude + 0.007}&layer=mapnik&marker=${issue.latitude}%2C${issue.longitude}`
    : null;

  const pMeta = priorityMeta[issue.priority];
  const canManage = role === "MANAGER" || role === "ADMIN";

  return (
    <div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Left rail */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <Link
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-400/50 hover:text-sky-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400/40 dark:hover:text-sky-400"
            href={back.href}
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              {back.label}
            </span>
          </Link>

          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Dispatch Pipeline
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${statusMeta[issue.status]}`}
              >
                {statusLabel(issue.status)}
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              {STAGES.map((stage, index) => {
                const isDone = index < currentStageIndex || issue.status === "CLOSED";
                const isCurrent = index === currentStageIndex && issue.status !== "CLOSED";
                return (
                  <li className="flex items-start gap-3" key={stage.key}>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isCurrent
                          ? "border-sky-400 bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                          : isDone
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-500"
                            : "border-slate-300 bg-transparent text-slate-400 dark:border-white/15"
                      }`}
                    >
                      {isDone ? "✓" : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-sky-600 dark:text-sky-400"
                            : isDone
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400"
                        }`}
                      >
                        {stage.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {stage.hint}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className={`${cardClass} space-y-3 p-5`}>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-sky-400" />
                Submitted
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(issue.createdAt)}
              </span>
            </div>

            {issue.resolvedAt ? (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolved
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(issue.resolvedAt)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-sky-400" />
                  Tracking ID
                </span>
                <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  #{issue.id.slice(-8).toUpperCase()}
                </span>
              </div>
            )}

            {issue.department ? (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Department</span>
                <span className="text-right font-semibold text-slate-800 dark:text-slate-200">
                  {issue.department.name}
                </span>
              </div>
            ) : null}

            {issue.reporter && role !== "CITIZEN" ? (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  Reporter
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {issue.reporter.name}
                </span>
              </div>
            ) : null}

            {issue.task?.assignee ? (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Wrench className="h-3.5 w-3.5 text-sky-400" />
                  Assigned to
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {issue.task.assignee.name}
                </span>
              </div>
            ) : null}
          </div>
        </aside>

        {/*  Main column  */}
        <main className="space-y-6">
          <section className={`${cardClass} sm:p-8`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                <Layers className="h-3 w-3" />
                {ISSUE_CATEGORY_LABELS[issue.category]}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${pMeta.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${pMeta.dot}`} />
                <ShieldAlert className="h-3 w-3" />
                {pMeta.label}
              </span>

              {issue.duplicateOfId && canManage ? (
                <Link
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
                  href={`/issues/${issue.duplicateOfId}`}
                >
                  Possible duplicate
                </Link>
              ) : null}
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
              {issue.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400" />
                {issue.address}
              </span>

              {hasValidCoords ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  {issue.latitude.toFixed(5)}°N, {issue.longitude.toFixed(5)}°E
                </span>
              ) : null}
            </div>
          </section>

          {/* Role based actions */}
          {canManage ? (
            <ManagerActions
              key={`${issue.id}-${issue.status}-${issue.priority}-${issue.department?.id ?? ""}`}
              issue={issue}
              onChanged={load}
            />
          ) : null}

          {role === "STAFF" && issue.task ? (
            <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
              <div>
                <p className={labelClass}>Your Work Order</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Update progress, add notes and upload completion photos.
                </p>
              </div>
              <Link className={primaryButton} href={`/staff/tasks/${issue.task.id}`}>
                Open Work Order
              </Link>
            </section>
          ) : null}

          {role === "CITIZEN" ? (
            <FeedbackSection issue={issue} onChanged={load} />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <section className={cardClass}>
              <p className={labelClass}>Field Description</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
                {issue.description}
              </p>
            </section>

            {mapEmbedUrl ? (
              <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                  <span className={labelClass}>Incident Pin</span>
                  <a
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-500 transition hover:text-sky-500 dark:text-slate-400"
                    href={`https://www.openstreetmap.org/?mlat=${issue.latitude}&mlon=${issue.longitude}#map=17/${issue.latitude}/${issue.longitude}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Map
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="min-h-[220px] flex-1 bg-slate-950">
                  <iframe
                    className="h-full w-full border-0"
                    loading="lazy"
                    src={mapEmbedUrl}
                    title="Incident location preview"
                  />
                </div>
              </section>
            ) : null}
          </div>

          {issue.imageUrls.length > 0 ? (
            <PhotoSection
              onSelect={setLightboxUrl}
              title="Photographic Evidence"
              urls={issue.imageUrls}
            />
          ) : null}

          {issue.task && issue.task.completionPhotoUrls.length > 0 ? (
            <PhotoSection
              onSelect={setLightboxUrl}
              title="Completion Photos"
              urls={issue.task.completionPhotoUrls}
            />
          ) : null}

          {/* Activity history */}
          <section className={cardClass}>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-sky-500" />
              <p className={labelClass}>Activity History</p>
            </div>

            {history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No activity has been recorded yet.
              </p>
            ) : (
              <ol className="mt-5 space-y-5 border-l border-slate-200 pl-5 dark:border-white/10">
                {history.map((entry) => (
                  <li className="relative" key={entry.id}>
                    <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.fromStatus ? (
                        <>
                          <span
                            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${statusMeta[entry.fromStatus]}`}
                          >
                            {statusLabel(entry.fromStatus)}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                        </>
                      ) : null}
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${statusMeta[entry.toStatus]}`}
                      >
                        {statusLabel(entry.toStatus)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                        {entry.note}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.actor
                        ? `${entry.actor.name} (${entry.actor.role.toLowerCase()})`
                        : "System"}{" "}
                      · {formatDate(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </main>
      </div>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            aria-label="Close image preview"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900 text-white transition hover:border-sky-400 hover:text-sky-400"
            onClick={() => setLightboxUrl(null)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Full size evidence"
            className="max-h-[85vh] max-w-[92vw] rounded-2xl border border-white/15 object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            src={lightboxUrl}
          />
        </div>
      ) : null}
    </div>
  );
}


/* Photo gallery                                                       */


function PhotoSection({
  title,
  urls,
  onSelect,
}: {
  title: string;
  urls: string[];
  onSelect: (url: string) => void;
}) {
  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between">
        <p className={labelClass}>
          {title} ({urls.length})
        </p>
        <span className="text-[11px] text-slate-400">Click any photo to inspect</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {urls.map((url, index) => (
          <button
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-left dark:border-white/10"
            key={`${url}-${index}`}
            onClick={() => onSelect(url)}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${title} ${index + 1}`}
              className="h-48 w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
              src={url}
            />
            <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Maximize2 className="h-3 w-3 text-sky-400" />
              Inspect
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}


/* Manager / Admin actions                                             */


function ManagerActions({
  issue,
  onChanged,
}: {
  issue: IssueDetail;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(
    issue.status === "UNDER_REVIEW" || issue.status === "ASSIGNED",
  );
  const [staffId, setStaffId] = useState("");
  const [priority, setPriority] = useState<IssuePriority>(issue.priority);
  const [note, setNote] = useState("");

  const needsAssignment =
    issue.status === "UNDER_REVIEW" || issue.status === "ASSIGNED";

  useEffect(() => {
    if (!needsAssignment) return;
    let cancelled = false;

    const query = new URLSearchParams({ role: "STAFF", limit: "50" });
    if (issue.department?.id) query.set("departmentId", issue.department.id);

    void apiClient
      .get<StaffOption[] | { items: StaffOption[] }>(
        `/api/users?${query.toString()}`,
      )
      .then((result) => {
        if (cancelled) return;
        setStaff(Array.isArray(result) ? result : result.items);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Unable to load staff",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setStaffLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsAssignment, issue.department?.id]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      setNote("");
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const isFinal = issue.status === "CLOSED";
  const awaitingReview =
    issue.status === "IN_PROGRESS" && issue.task?.status === "COMPLETED";

  if (isFinal) return null;

  return (
    <section className={`${cardClass} space-y-5`}>
      <p className={labelClass}>Manager Actions</p>

      {/* Priority */}
      {issue.status !== "RESOLVED" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
              htmlFor="issue-priority"
            >
              Priority
            </label>
            <select
              className={fieldClass}
              disabled={busy}
              id="issue-priority"
              onChange={(event) => setPriority(event.target.value as IssuePriority)}
              value={priority}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {priorityMeta[value].label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={primaryButton}
            disabled={busy || priority === issue.priority}
            onClick={() =>
              void run(
                () => apiClient.patch(`/api/issues/${issue.id}/priority`, { priority }),
                "Priority updated",
              )
            }
            type="button"
          >
            Save Priority
          </button>
        </div>
      ) : null}

      {/* Verify */}
      {issue.status === "SUBMITTED" ? (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Verify the location and details, then move this report to review.
          </p>
          <button
            className={`${primaryButton} mt-3`}
            disabled={busy}
            onClick={() =>
              void run(
                () => apiClient.post(`/api/issues/${issue.id}/verify`, {}),
                "Report verified and moved to review",
              )
            }
            type="button"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify Report
          </button>
        </div>
      ) : null}

      {/* Assign */}
      {needsAssignment ? (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <label
            className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
            htmlFor="assign-staff"
          >
            {issue.status === "ASSIGNED" ? "Reassign to staff" : "Assign to staff"}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className={fieldClass}
              disabled={busy || staffLoading}
              id="assign-staff"
              onChange={(event) => setStaffId(event.target.value)}
              value={staffId}
            >
              <option value="">
                {staffLoading ? "Loading staff..." : "Select maintenance staff"}
              </option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button
              className={primaryButton}
              disabled={busy || !staffId}
              onClick={() =>
                void run(
                  () => apiClient.post(`/api/issues/${issue.id}/assign`, { staffId }),
                  "Task assigned",
                )
              }
              type="button"
            >
              <Wrench className="h-4 w-4" />
              Assign
            </button>
          </div>
          {!staffLoading && staff.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              No maintenance staff found for this department.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Review completed work */}
      {awaitingReview && issue.task ? (
        <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Staff marked this work as completed. Review the completion photos
            below and approve or send it back.
          </p>
          <textarea
            className="mt-3 min-h-[84px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
            onChange={(event) => setNote(event.target.value)}
            placeholder="Review note (required when sending back)"
            value={note}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              className={primaryButton}
              disabled={busy}
              onClick={() =>
                void run(
                  () =>
                    apiClient.post(`/api/tasks/${issue.task?.id}/review`, {
                      decision: "APPROVE",
                      note: note.trim() || undefined,
                    }),
                  "Work approved and report resolved",
                )
              }
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve &amp; Resolve
            </button>
            <button
              className={secondaryButton}
              disabled={busy || note.trim().length === 0}
              onClick={() =>
                void run(
                  () =>
                    apiClient.post(`/api/tasks/${issue.task?.id}/review`, {
                      decision: "REJECT",
                      note: note.trim(),
                    }),
                  "Work sent back to staff",
                )
              }
              type="button"
            >
              Send Back
            </button>
          </div>
        </div>
      ) : null}

      {/* Close */}
      {issue.status === "RESOLVED" ||
      issue.status === "SUBMITTED" ||
      issue.status === "UNDER_REVIEW" ? (
        <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {issue.status === "RESOLVED"
              ? "Close this report once the citizen has had a chance to respond."
              : "Close this report if it is invalid or a duplicate. A reason is required."}
          </p>
          {issue.status !== "RESOLVED" ? (
            <input
              className={`${fieldClass} mt-3`}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason for closing"
              value={note}
            />
          ) : null}
          <button
            className={`${secondaryButton} mt-3`}
            disabled={busy || (issue.status !== "RESOLVED" && note.trim().length === 0)}
            onClick={() =>
              void run(
                () =>
                  apiClient.post(`/api/issues/${issue.id}/status`, {
                    status: "CLOSED",
                    note: note.trim() || undefined,
                  }),
                "Report closed",
              )
            }
            type="button"
          >
            Close Report
          </button>
        </div>
      ) : null}
    </section>
  );
}

/* Citizen feedback  */


function FeedbackSection({
  issue,
  onChanged,
}: {
  issue: IssueDetail;
  onChanged: () => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resolved = issue.status === "RESOLVED" || issue.status === "CLOSED";
  if (!resolved) return null;

  if (issue.feedback) {
    return (
      <section className={cardClass}>
        <p className={labelClass}>Your Feedback</p>
        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              className={`h-5 w-5 ${
                value <= (issue.feedback?.rating ?? 0)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
              key={value}
            />
          ))}
        </div>
        {issue.feedback.comment ? (
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
            {issue.feedback.comment}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Thank you for helping us improve city services.
        </p>
      </section>
    );
  }

  async function submit() {
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/feedback", {
        issueId: issue.id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thank you for your feedback");
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={cardClass}>
      <p className={labelClass}>How did we do?</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Your issue has been resolved. Rate the work and share any comments.
      </p>

      <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className="rounded p-1 transition hover:scale-110"
            key={value}
            onClick={() => setRating(value)}
            role="radio"
            type="button"
          >
            <Star
              className={`h-7 w-7 ${
                value <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        className="mt-4 min-h-[96px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
        maxLength={500}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional comment"
        value={comment}
      />

      <button
        className={`${primaryButton} mt-4`}
        disabled={submitting || rating < 1}
        onClick={() => void submit()}
        type="button"
      >
        {submitting ? "Sending..." : "Submit Feedback"}
      </button>
    </section>
  );
}
