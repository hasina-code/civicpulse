"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  Hourglass,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  Navigation,
  Play,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "../../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../../shared/constants/priorities";
import type { TaskStatus } from "../../../../../shared/constants/status";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type TaskDetail = {
  id: string;
  status: TaskStatus;
  dueAt: string | null;
  reviewNote: string | null;
  completionPhotoUrls: string[];
  createdAt: string;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    description: string;
    category: IssueCategory;
    priority: IssuePriority;
    address: string;
    latitude: number;
    longitude: number;
    imageUrls: string[];
  };
  updates: {
    id: string;
    note: string;
    imageUrls: string[];
    createdAt: string;
    author: { name: string } | null;
  }[];
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 5;
const MAX_NOTE = 1000;

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

const priorityStyle: Record<IssuePriority, string> = {
  LOW: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM:
    "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  HIGH: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  CRITICAL:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

const cardClass =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-xl";
const labelClass =
  "font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400";
const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white shadow-lg shadow-sky-500/15 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/upload", { method: "POST", body: form });
  const body = (await response.json().catch(() => null)) as
    | { url?: string; data?: { url?: string }; error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.error ?? body?.message ?? "Image upload failed");
  }

  const url = body?.url ?? body?.data?.url;
  if (typeof url !== "string") throw new Error("Image upload failed");
  return url;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function StaffTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [now, setNow] = useState(() => 0);

  const load = useCallback(async () => {
    try {
      const result = await apiClient.get<TaskDetail>(`/api/tasks/${id}`);
      setTask(result);
      setNow(Date.now());
      setLoadError(null);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Unable to load this task",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900/60" />
            <div className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900/60" />
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-sky-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-sky-400"
          href="/staff/tasks"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assigned Tasks
        </Link>
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/70">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            Work order not available
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {loadError ?? "It may have been reassigned or removed."}
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

  const { issue } = task;
  const hasCoords =
    Number.isFinite(issue.latitude) && Number.isFinite(issue.longitude);
  const mapEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${issue.longitude - 0.006}%2C${issue.latitude - 0.006}%2C${issue.longitude + 0.006}%2C${issue.latitude + 0.006}&layer=mapnik&marker=${issue.latitude}%2C${issue.longitude}`
    : null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}`
    : null;

  const overdue =
    task.status !== "COMPLETED" &&
    task.dueAt !== null &&
    new Date(task.dueAt).getTime() < now;
  const canWork = task.status !== "COMPLETED";

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-sky-400/50 hover:text-sky-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
        href="/staff/tasks"
      >
        <ArrowLeft className="h-4 w-4 text-sky-500" /> Back to Assigned Tasks
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---------------- Left: issue information ---------------- */}
        <div className="space-y-6">
          <section className={`${cardClass} sm:p-8`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                <Layers className="h-3 w-3" />
                {ISSUE_CATEGORY_LABELS[issue.category]}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${priorityStyle[issue.priority]}`}
              >
                <ShieldAlert className="h-3 w-3" />
                {issue.priority}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${statusStyle[task.status]}`}
              >
                {statusLabel[task.status]}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
              {issue.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/80 pt-4 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-sky-500" />
                {issue.address}
              </span>
              {hasCoords ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-white/[0.04]">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  {issue.latitude.toFixed(5)}°N, {issue.longitude.toFixed(5)}°E
                </span>
              ) : null}
              <span
                className={`inline-flex items-center gap-1.5 ${
                  overdue ? "font-bold text-red-600 dark:text-red-400" : ""
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-sky-400" />
                {overdue ? "Overdue · " : "Due "}
                {formatDate(task.dueAt)}
              </span>
            </div>
          </section>

          {task.status === "REJECTED" ? (
            <section className="rounded-3xl border border-rose-300 bg-rose-50 p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
              <p className="flex items-center gap-2 text-sm font-black text-rose-800 dark:text-rose-300">
                <RotateCcw className="h-4 w-4" />
                Returned by your manager
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800 dark:text-slate-200">
                {task.reviewNote ?? "No note was provided."}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Fix the work, upload new completion photos and mark it as
                completed again.
              </p>
            </section>
          ) : null}

          <section className={cardClass}>
            <p className={labelClass}>Issue Description</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
              {issue.description}
            </p>
          </section>

          {mapEmbedUrl ? (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3 dark:border-white/10">
                <span className={labelClass}>Work Location</span>
                <div className="flex items-center gap-3">
                  <a
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-slate-500 transition hover:text-sky-500 dark:text-slate-400"
                    href={`https://www.openstreetmap.org/?mlat=${issue.latitude}&mlon=${issue.longitude}#map=17/${issue.latitude}/${issue.longitude}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open map <ExternalLink className="h-3 w-3" />
                  </a>
                  {directionsUrl ? (
                    <a
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-600"
                      href={directionsUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Navigation className="h-3 w-3" /> Directions
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="h-[280px] bg-slate-950">
                <iframe
                  className="h-full w-full border-0"
                  loading="lazy"
                  src={mapEmbedUrl}
                  title="Work location"
                />
              </div>
            </section>
          ) : null}

          {issue.imageUrls.length > 0 ? (
            <PhotoGrid
              onSelect={setLightboxUrl}
              title="Reported Photos"
              urls={issue.imageUrls}
            />
          ) : null}

          {task.completionPhotoUrls.length > 0 ? (
            <PhotoGrid
              onSelect={setLightboxUrl}
              title="Your Completion Photos"
              urls={task.completionPhotoUrls}
            />
          ) : null}

          <section className={cardClass}>
            <p className={labelClass}>Progress Updates</p>
            {task.updates.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No progress updates yet.
              </p>
            ) : (
              <ol className="mt-5 space-y-5 border-l border-slate-200 pl-5 dark:border-white/10">
                {task.updates.map((update) => (
                  <li className="relative" key={update.id}>
                    <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                      {update.note}
                    </p>
                    {update.imageUrls.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {update.imageUrls.map((url) => (
                          <button
                            className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                            key={url}
                            onClick={() => setLightboxUrl(url)}
                            type="button"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt="Progress photo"
                              className="h-16 w-16 object-cover"
                              src={url}
                            />
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {update.author?.name ?? "Crew"} ·{" "}
                      {formatDateTime(update.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* ---------------- Right: actions ---------------- */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
          {task.status === "COMPLETED" ? (
            <section className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-300">
                <Hourglass className="h-4 w-4" />
                Waiting for manager review
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
                You marked this work as completed on{" "}
                {formatDateTime(task.updatedAt)}. You will be notified when
                your manager approves it or sends it back.
              </p>
            </section>
          ) : null}

          {canWork ? (
            <WorkPanel onChanged={load} task={task} />
          ) : null}
        </aside>
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
            alt="Full size"
            className="max-h-[85vh] max-w-[92vw] rounded-2xl border border-white/15 object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            src={lightboxUrl}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photo grid                                                          */
/* ------------------------------------------------------------------ */

function PhotoGrid({
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
      <p className={labelClass}>
        {title} ({urls.length})
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {urls.map((url, index) => (
          <button
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-white/10"
            key={`${url}-${index}`}
            onClick={() => onSelect(url)}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${title} ${index + 1}`}
              className="h-40 w-full object-cover transition hover:scale-105 hover:opacity-90"
              src={url}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Photo uploader                                                      */
/* ------------------------------------------------------------------ */

function PhotoUploader({
  urls,
  onChange,
  disabled,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = MAX_PHOTOS - urls.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_PHOTOS} photos`);
      return;
    }

    const accepted = files.slice(0, room).filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WebP images are allowed`);
        return false;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: image must be smaller than 5 MB`);
        return false;
      }
      return true;
    });
    if (files.length > room) {
      toast.error(`Only ${MAX_PHOTOS} photos can be attached`);
    }
    if (accepted.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of accepted) {
      try {
        uploaded.push(await uploadImage(file));
      } catch (caught) {
        toast.error(
          caught instanceof Error ? caught.message : "Image upload failed",
        );
      }
    }
    setUploading(false);
    if (uploaded.length > 0) onChange([...urls, ...uploaded]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div
            className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10"
            key={url}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Selected" className="h-full w-full object-cover" src={url} />
            <button
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/80 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              disabled={disabled}
              onClick={() => onChange(urls.filter((item) => item !== url))}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < MAX_PHOTOS ? (
          <button
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-500 transition hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 dark:border-white/20"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            {uploading ? "Uploading" : "Add photo"}
          </button>
        ) : null}
      </div>
      <input
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        multiple
        onChange={(event) => void onFiles(event)}
        ref={inputRef}
        type="file"
      />
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        JPG, PNG or WebP · up to 5 MB each · max {MAX_PHOTOS} photos
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Work panel (start / update / complete)                              */
/* ------------------------------------------------------------------ */

function WorkPanel({
  task,
  onChanged,
}: {
  task: TaskDetail;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [updatePhotos, setUpdatePhotos] = useState<string[]>([]);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const notStarted = task.status === "PENDING" || task.status === "REJECTED";

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await onChanged();
      return true;
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function startWork() {
    await run(
      () =>
        apiClient.post(`/api/tasks/${task.id}/updates`, {
          action: "PROGRESS",
          note:
            task.status === "REJECTED"
              ? "Rework started after manager return."
              : "Work started on site.",
          photoUrls: [],
        }),
      "Work started",
    );
  }

  async function submitUpdate() {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Write a short progress note first");
      return;
    }
    const ok = await run(
      () =>
        apiClient.post(`/api/tasks/${task.id}/updates`, {
          action: "PROGRESS",
          note: trimmed,
          photoUrls: updatePhotos,
        }),
      "Progress update saved",
    );
    if (ok) {
      setNote("");
      setUpdatePhotos([]);
    }
  }

  async function complete() {
    const ok = await run(
      () =>
        apiClient.post(`/api/tasks/${task.id}/updates`, {
          action: "COMPLETE",
          completionPhotoUrls: completionPhotos,
        }),
      "Work sent to your manager for review",
    );
    if (ok) {
      setConfirming(false);
      setCompletionPhotos([]);
    }
  }

  return (
    <>
      {/* Start */}
      {notStarted ? (
        <section className={cardClass}>
          <p className={labelClass}>
            {task.status === "REJECTED" ? "Rework" : "Start Work"}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {task.status === "REJECTED"
              ? "Begin the corrections requested by your manager."
              : "Press start when you reach the site and begin the repair."}
          </p>
          <button
            className={`${primaryButton} mt-4 w-full`}
            disabled={busy}
            onClick={() => void startWork()}
            type="button"
          >
            <Play className="h-4 w-4" />
            {task.status === "REJECTED" ? "Start Rework" : "Start Work"}
          </button>
        </section>
      ) : (
        <>
          {/* Progress update */}
          <section className={cardClass}>
            <p className={labelClass}>Add Progress Update</p>
            <textarea
              className="mt-3 min-h-[96px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
              disabled={busy}
              maxLength={MAX_NOTE}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What has been done? Materials used, delays, notes..."
              value={note}
            />
            <p className="mt-1 text-right font-mono text-[10px] text-slate-400">
              {note.length}/{MAX_NOTE}
            </p>
            <div className="mt-2">
              <PhotoUploader
                disabled={busy}
                onChange={setUpdatePhotos}
                urls={updatePhotos}
              />
            </div>
            <button
              className={`${secondaryButton} mt-4 w-full`}
              disabled={busy || note.trim().length === 0}
              onClick={() => void submitUpdate()}
              type="button"
            >
              <Clock3 className="h-4 w-4" />
              Save Update
            </button>
          </section>

          {/* Complete */}
          <section className={cardClass}>
            <p className={labelClass}>Complete Work Order</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Upload at least one completion photo, then send the work to your
              manager for review.
            </p>
            <div className="mt-4">
              <PhotoUploader
                disabled={busy}
                onChange={setCompletionPhotos}
                urls={completionPhotos}
              />
            </div>

            {confirming ? (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Send this work order for review? You cannot edit it until
                  your manager responds.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void complete()}
                    type="button"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {busy ? "Sending..." : "Yes, send"}
                  </button>
                  <button
                    className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 transition hover:bg-white disabled:opacity-50 dark:border-white/15 dark:text-slate-200"
                    disabled={busy}
                    onClick={() => setConfirming(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || completionPhotos.length === 0}
                onClick={() => setConfirming(true)}
                type="button"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Completed
              </button>
            )}
            {completionPhotos.length === 0 && !confirming ? (
              <p className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                Add a completion photo to enable this button.
              </p>
            ) : null}
          </section>
        </>
      )}
    </>
  );
}
