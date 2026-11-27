"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Maximize2,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../../shared/constants/priorities";
import type { IssueStatus } from "../../../../../shared/constants/status";

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
};

const STAGES: { key: IssueStatus; title: string; hint: string }[] = [
  {
    key: "SUBMITTED",
    title: "Report Logged",
    hint: "Received by municipal intake",
  },
  {
    key: "UNDER_REVIEW",
    title: "Triage & Verification",
    hint: "Inspector validating location",
  },
  {
    key: "ASSIGNED",
    title: "Crew Dispatched",
    hint: "Routed to field engineering unit",
  },
  {
    key: "IN_PROGRESS",
    title: "Repair Active",
    hint: "On-site restoration underway",
  },
  {
    key: "RESOLVED",
    title: "Resolved & Verified",
    hint: "Infrastructure restored",
  },
];

const priorityMeta: Record<
  IssuePriority,
  { label: string; dot: string; badge: string }
> = {
  LOW: {
    label: "Low Severity",
    dot: "bg-slate-400",
    badge: "border-white/10 bg-white/[0.04] text-slate-300",
  },
  MEDIUM: {
    label: "Medium Severity",
    dot: "bg-sky-400",
    badge: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  },
  HIGH: {
    label: "High Severity",
    dot: "bg-amber-400",
    badge: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  },
  CRITICAL: {
    label: "Critical Hazard",
    dot: "bg-rose-400",
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-300",
  },
};

const statusMeta: Record<IssueStatus, string> = {
  SUBMITTED: "border-white/15 bg-white/[0.06] text-slate-200",
  UNDER_REVIEW: "border-sky-400/35 bg-sky-400/10 text-sky-300",
  ASSIGNED: "border-indigo-400/35 bg-indigo-400/10 text-indigo-300",
  IN_PROGRESS: "border-sky-400/55 bg-sky-400/15 text-sky-200",
  RESOLVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  CLOSED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};

export default function CitizenIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    void params
      .then(({ id }) => apiClient.get<IssueDetail>(`/api/issues/${id}`))
      .then(setIssue)
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load the report",
        ),
      )
      .finally(() => setLoading(false));
  }, [params]);

  const currentStageIndex = useMemo(() => {
    if (!issue) return 0;
    if (issue.status === "CLOSED") return STAGES.length - 1;
    const found = STAGES.findIndex((stage) => stage.key === issue.status);
    return found >= 0 ? found : 0;
  }, [issue]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  if (loading) {
    return (
      <div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          <div className="h-[520px] animate-pulse rounded-3xl border border-white/10 bg-slate-900/60" />
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-slate-900/60" />
            <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-slate-900/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-sky-400 transition hover:border-sky-400/40 hover:bg-sky-400/10"
          href="/citizen/issues"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Reports
        </Link>
        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 px-6 py-20 text-center backdrop-blur-xl">
          <p className="text-base font-bold text-white">Report not found</p>
          <p className="mt-1 text-xs text-slate-400">
            The requested report may have been removed or is unavailable.
          </p>
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

  return (
    <div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
    
        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <Link
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-400/50 hover:text-sky-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400/40 dark:hover:text-sky-400"
            href="/citizen/issues"
          >
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              Back to My Reports
            </span>
            <span className="font-mono text-[10px] text-slate-400">ESC</span>
          </Link>

   
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Dispatch Pipeline
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${statusMeta[issue.status]}`}
              >
                {issue.status.replaceAll("_", " ")}
              </span>
            </div>

            <ol className="mt-5 space-y-4">
              {STAGES.map((stage, index) => {
                const isDone = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                return (
                  <li className="flex items-start gap-3" key={stage.key}>
                    <div className="mt-0.5 flex flex-col items-center">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                          isCurrent
                            ? "border-sky-400 bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                            : isDone
                              ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-400"
                              : "border-slate-300 bg-transparent text-slate-400 dark:border-white/15"
                        }`}
                      >
                        {isDone ? "✓" : index + 1}
                      </span>
                    </div>
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

    
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
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
                  #{issue.id}
                </span>
              </div>
            )}
          </div>
        </aside>

     
        <main className="space-y-6">
       
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl sm:p-8">
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
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
              {issue.title}{" "}
              <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                Overview
              </span>
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                Field Description
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
                {issue.description}
              </p>
            </section>

            {mapEmbedUrl ? (
              <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
                    Incident Pin
                  </span>
                  <a
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-500 transition hover:text-sky-400 dark:text-slate-400"
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
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                  Photographic Evidence ({issue.imageUrls.length})
                </p>
                <span className="text-[11px] text-slate-400">
                  Click any photo to inspect
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {issue.imageUrls.map((url, idx) => (
                  <button
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-left dark:border-white/10"
                    key={`${url}-${idx}`}
                    onClick={() => setLightboxUrl(url)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Evidence ${idx + 1}`}
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
          ) : null}
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