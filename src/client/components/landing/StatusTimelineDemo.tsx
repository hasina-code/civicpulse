import {
  CircleCheckBig,
  FileText,
  Lock,
  Search,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ISSUE_STATUSES, type IssueStatus } from "../../../shared/constants/status";

const statusDetails: Record<
  IssueStatus,
  { label: string; description: string; owner: string; icon: LucideIcon }
> = {
  SUBMITTED: {
    label: "Submitted",
    description: "A resident reports the problem with a photo and location.",
    owner: "Citizen",
    icon: FileText,
  },
  UNDER_REVIEW: {
    label: "Under review",
    description: "The department verifies the report and sets its priority.",
    owner: "Manager",
    icon: Search,
  },
  ASSIGNED: {
    label: "Assigned",
    description: "A maintenance team member receives the task.",
    owner: "Manager",
    icon: UserCheck,
  },
  IN_PROGRESS: {
    label: "In progress",
    description: "Field crew work on site and post progress updates.",
    owner: "Field crew",
    icon: Wrench,
  },
  RESOLVED: {
    label: "Resolved",
    description: "The work is finished and completion photos are uploaded.",
    owner: "Field crew",
    icon: CircleCheckBig,
  },
  CLOSED: {
    label: "Closed",
    description: "The completed work is reviewed and the report is closed.",
    owner: "Manager",
    icon: Lock,
  },
};

export function StatusTimelineDemo() {
  return (
    <section
      aria-labelledby="status-timeline-title"
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="lifecycle"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full border border-signal-blue/20 bg-signal-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-signal-blue">
            Clear progress
          </p>
          <h2
            className="mt-5 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="status-timeline-title"
          >
            Every report follows a defined path.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            A consistent status lifecycle helps residents and city teams
            understand what happens next.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-xl lg:grid lg:max-w-none lg:grid-cols-6">
          {ISSUE_STATUSES.map((status, index) => {
            const { label, description, owner, icon: Icon } = statusDetails[status];
            const isLast = index === ISSUE_STATUSES.length - 1;

            return (
              <li
                className="group relative flex gap-4 pb-6 last:pb-0 lg:flex-col lg:pb-0 lg:pr-4 lg:last:pr-0"
                key={status}
              >
                {/* Connector: vertical on small screens, horizontal on large */}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[23px] top-12 w-0.5 bg-signal-blue/25 lg:bottom-auto lg:left-12 lg:right-0 lg:top-[23px] lg:h-0.5 lg:w-auto"
                  />
                ) : null}

                <span
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-signal-cream transition duration-300 group-hover:scale-110 motion-reduce:transform-none dark:ring-signal-night ${
                    isLast ? "bg-emerald-600" : "bg-signal-blue"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>

                <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-signal-blue group-hover:shadow-lg motion-reduce:transform-none dark:border-slate-800 dark:bg-signal-navy lg:mt-5">
                  <p className="text-xs font-bold tracking-widest text-signal-blue dark:text-slate-400">
                    STEP {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-semibold text-signal-navy dark:text-slate-100">
                    {label}
                  </h3>
                  <p className="mb-4 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                  <span className="mt-auto self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {owner}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}