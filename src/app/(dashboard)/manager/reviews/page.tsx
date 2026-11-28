"use client";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
  MapPin,
  RotateCcw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ReviewTask = {
  id: string;
  status: "COMPLETED";
  completionPhotoUrls: string[];
  reviewNote: string | null;
  dueAt: string | null;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    status: string;
    address: string;
  };
  assignee: { id: string; name: string } | null;
};

type TaskResult = {
  items: ReviewTask[];
  page: number;
  total: number;
  totalPages: number;
};

type ReviewDecision = "APPROVE" | "RETURN";

const PAGE_SIZE = 10;
const MAX_NOTE_LENGTH = 500;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isOverdue(dueAt: string | null) {
  return dueAt ? new Date(dueAt).getTime() < Date.now() : false;
}


/* Page   */


export default function ManagerReviewsPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce the search box so the API is not called on every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // Close the photo preview with Escape.
  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      const parameters = new URLSearchParams({
        status: "COMPLETED",
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: "updatedAt:desc",
      });
      if (query) parameters.set("q", query);

      try {
        const result = await apiClient.get<TaskResult>(
          `/api/tasks?${parameters.toString()}`,
          { signal },
        );
        if (signal?.aborted) return;

        // After approving the last item on a page, step back one page.
        if (result.items.length === 0 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
          return;
        }

        setTasks(result.items);
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
      } catch (caught) {
        if (signal?.aborted) return;
        const message =
          caught instanceof Error ? caught.message : "Unable to load reviews";
        setError(message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadKey]);

  async function review(taskId: string, decision: ReviewDecision) {
    const note = (notes[taskId] ?? "").trim();

    if (decision === "RETURN" && !note) {
      toast.error("Add a note explaining what needs to be corrected");
      return;
    }

    setBusyId(taskId);
    try {
      await apiClient.post(`/api/tasks/${taskId}/review`, {
        decision,
        note: note || undefined,
      });

      toast.success(
        decision === "APPROVE"
          ? "Work approved and issue resolved"
          : "Work returned to staff",
      );

      setNotes((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
      setReloadKey((current) => current + 1);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  const hasFilter = query.length > 0;

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            Quality Control
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Work Completion Reviews
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Approve completed field work or return it to the crew for
            correction.
          </p>
        </div>

        <span className="w-fit rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-mono text-xs font-bold text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300">
          {total} awaiting review
        </span>
      </header>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-900"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by issue, address, or staff name..."
          value={search}
        />
        {search ? (
          <button
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
            onClick={() => setSearch("")}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Content states */}
      {loading && tasks.length === 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900"
              key={index}
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">
            {error}
          </p>
          <button
            className="mt-5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            onClick={() => setReloadKey((current) => current + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/10">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            {hasFilter
              ? "No reviews match your search"
              : "No completed work is awaiting review"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasFilter
              ? "Try a different keyword or clear the search."
              : "New items appear here when staff mark their work orders as completed."}
          </p>
          {hasFilter ? (
            <button
              className="mt-5 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-600"
              onClick={() => setSearch("")}
              type="button"
            >
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <div
          className={`mt-5 grid gap-4 transition-opacity xl:grid-cols-2 ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {tasks.map((task) => {
            const busy = busyId === task.id;
            const note = notes[task.id] ?? "";
            const overdue = isOverdue(task.dueAt);

            return (
              <article
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      TASK #{task.id.slice(-8).toUpperCase()}
                    </p>
                    <h2 className="mt-1 truncate text-base font-black text-slate-900 dark:text-white">
                      {task.issue.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                      <span className="truncate">{task.issue.address}</span>
                    </p>
                  </div>
                  <Wrench className="h-5 w-5 shrink-0 text-sky-500" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-200 py-3 text-xs dark:border-white/10">
                  <div>
                    <p className="text-slate-400">Assigned staff</p>
                    <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
                      {task.assignee?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Completed</p>
                    <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                  {task.dueAt ? (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <CalendarClock
                        className={`h-3.5 w-3.5 ${
                          overdue ? "text-red-500" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={
                          overdue
                            ? "font-bold text-red-600 dark:text-red-400"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        {overdue ? "Was due " : "Due "}
                        {formatDate(task.dueAt)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Completion photos */}
                {task.completionPhotoUrls.length > 0 ? (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      {task.completionPhotoUrls.slice(0, 3).map((url, index) => (
                        <button
                          aria-label={`Open completion photo ${index + 1}`}
                          className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                          key={url}
                          onClick={() => setLightboxUrl(url)}
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={`Completion evidence ${index + 1}`}
                            className="h-20 w-full object-cover transition hover:scale-105"
                            src={url}
                          />
                        </button>
                      ))}
                    </div>
                    {task.completionPhotoUrls.length > 3 ? (
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        +{task.completionPhotoUrls.length - 3} more photo
                        {task.completionPhotoUrls.length - 3 > 1 ? "s" : ""} on
                        the issue page
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    <ImageOff className="h-4 w-4 shrink-0" />
                    No completion photos were uploaded.
                  </div>
                )}

                {/* Review note */}
                <div className="mt-4">
                  <textarea
                    className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950"
                    disabled={busy}
                    maxLength={MAX_NOTE_LENGTH}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="Review note (required when returning)"
                    value={note}
                  />
                  <p className="mt-1 text-right font-mono text-[10px] text-slate-400">
                    {note.length}/{MAX_NOTE_LENGTH}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Link
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-white/10 dark:text-slate-300"
                    href={`/issues/${task.issue.id}`}
                  >
                    <Eye className="h-3.5 w-3.5" /> Issue
                  </Link>
                  <button
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
                    disabled={busy}
                    onClick={() => void review(task.id, "RETURN")}
                    type="button"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Return
                  </button>
                  <button
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void review(task.id, "APPROVE")}
                    type="button"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {busy ? "Saving..." : "Approve"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!error && totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page{" "}
            <span className="font-extrabold text-slate-800 dark:text-white">
              {page}
            </span>{" "}
            of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Photo lightbox */}
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
            alt="Completion evidence"
            className="max-h-[85vh] max-w-[92vw] rounded-2xl border border-white/15 object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            src={lightboxUrl}
          />
        </div>
      ) : null}
    </div>
  );
}
