import { ISSUE_STATUSES, type IssueStatus } from "../../../shared/constants/status";

const statusLabels: Record<IssueStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function StatusTimelineDemo() {
  return (
    <section
      aria-labelledby="status-timeline-title"
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="lifecycle"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            Clear progress
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="status-timeline-title"
          >
            Every report follows a defined path.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            A consistent status lifecycle helps residents and city teams
            understand what happens next.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ISSUE_STATUSES.map((status, index) => (
            <li
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
              key={status}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal-blue text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-signal-navy dark:text-slate-100">
                  {statusLabels[status]}
                </p>
                {index < ISSUE_STATUSES.length - 1 ? (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                    Progresses to the next review or work step
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                    The report lifecycle is complete
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
