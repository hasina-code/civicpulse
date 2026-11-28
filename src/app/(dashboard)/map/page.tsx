"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../client/lib/api-client";

type MapIssue = {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  location: { name: string; area: string; ward: string | null } | null;
};

export default function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ issueId?: string }>;
}) {
  const [issue, setIssue] = useState<MapIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void searchParams
      .then(({ issueId }) => {
        if (!issueId) return null;
        return apiClient.get<MapIssue>(`/api/issues/${issueId}`);
      })
      .then(setIssue)
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Unable to load issue location"),
      )
      .finally(() => setLoading(false));
  }, [searchParams]);

  const validCoordinates =
    issue &&
    Number.isFinite(issue.latitude) &&
    Number.isFinite(issue.longitude);

  const mapUrl = validCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${issue.longitude - 0.008}%2C${issue.latitude - 0.008}%2C${issue.longitude + 0.008}%2C${issue.latitude + 0.008}&layer=mapnik&marker=${issue.latitude}%2C${issue.longitude}`
    : "https://www.openstreetmap.org/export/embed.html?bbox=90.35%2C23.65%2C90.50%2C23.85&layer=mapnik";

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-sky-600 dark:text-slate-300" href="/manager/department-queue">
        <ArrowLeft className="h-4 w-4" /> Back to Department Queue
      </Link>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 dark:border-white/10">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Issue Map Location</h1>
            {issue ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                {issue.location ? `${issue.location.area}${issue.location.ward ? `, Ward ${issue.location.ward}` : ""}` : issue.address}
              </p>
            ) : null}
          </div>
          {issue ? (
            <Link className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-sky-600 dark:border-white/10" href={`/issues/${issue.id}`}>
              View Details
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="h-[620px] animate-pulse bg-slate-100 dark:bg-slate-900" />
        ) : (
          <iframe
            className="h-[620px] w-full border-0"
            loading="lazy"
            src={mapUrl}
            title={issue ? `Map for ${issue.title}` : "Issue map"}
          />
        )}
      </div>
    </div>
  );
}
