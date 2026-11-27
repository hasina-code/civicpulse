"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function CitizenIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  if (loading) {
    return (
      <div className="mx-auto max-w-[1000px] px-5 py-8">
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-[1000px] px-5 py-16 text-center">
        <p className="font-bold text-slate-700 dark:text-slate-200">
          Report not found
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400"
        href="/citizen/issues"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Reports
      </Link>

      <article className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70">
        <div className="border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
          <p className="text-[10px] font-bold uppercase text-slate-400">
            Report #{issue.id}
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {issue.title}
          </h1>
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3 w-3" />
            {issue.address}
          </p>
        </div>
        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_280px] sm:p-6">
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-500">
              Description
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {issue.description}
            </p>
            {issue.imageUrls.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {issue.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Issue evidence"
                    className="h-52 w-full rounded-lg border border-slate-200 object-cover dark:border-white/10"
                    key={url}
                    src={url}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <aside className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <div>
              <p className="text-[10px] uppercase text-slate-400">Category</p>
              <p className="mt-1 text-sm font-bold">
                {ISSUE_CATEGORY_LABELS[issue.category]}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Priority</p>
              <p className="mt-1 text-sm font-bold">{issue.priority}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Status</p>
              <p className="mt-1 text-sm font-bold">{issue.status.replaceAll("_", " ")}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Submitted</p>
              <p className="mt-1 text-sm">{formatDate(issue.createdAt)}</p>
            </div>
            {issue.resolvedAt ? (
              <div>
                <p className="text-[10px] uppercase text-slate-400">Resolved</p>
                <p className="mt-1 text-sm">{formatDate(issue.resolvedAt)}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  );
}
