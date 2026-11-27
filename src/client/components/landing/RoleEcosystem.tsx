import {
  ArrowRight,
  BriefcaseBusiness,
  HardHat,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  USER_ROLES,
  type UserRole,
} from "../../../shared/constants/roles";

const roleDetails: Record<
  UserRole,
  {
    icon: LucideIcon;
    portal: string;
    tagline: string;
    description: string;
    features: string[];
    action: string;
  }
> = {
  [USER_ROLES.CITIZEN]: {
    icon: UsersRound,
    portal: "Citizens",
    tagline: "Spot. Report. Track.",
    description:
      "Empowering city residents to report infrastructure problems, track progress in real time, and verify fixes.",
    features: [
      "Report issues with photos and precise GPS location",
      "50m duplicate detection radar alerts",
      "Live timeline status updates",
      "Direct 5-star citizen satisfaction rating",
    ],
    action: "Open Citizen Portal",
  },
  [USER_ROLES.MANAGER]: {
    icon: BriefcaseBusiness,
    portal: "Department Managers",
    tagline: "Triage. Assign. Monitor.",
    description:
      "Unified command center for department dispatchers to review incoming incidents and orchestrate repair crews.",
    features: [
      "Real-time incident verification and priority triage",
      "Assign tasks to field maintenance technicians",
      "Track active workloads and crew capacity",
      "Monitor SLA timelines and work bottlenecks",
    ],
    action: "Access Dispatch Hub",
  },
  [USER_ROLES.STAFF]: {
    icon: HardHat,
    portal: "Maintenance Staff",
    tagline: "Navigate. Repair. Verify.",
    description:
      "Mobile-first tool for on-ground repair technicians to receive assignments and submit completion evidence.",
    features: [
      "Mobile task queue with prioritized work orders",
      "Open task locations and GPS coordinates",
      "One-tap progress status updates",
      "Upload completion photographs",
    ],
    action: "Field Work Orders",
  },
  [USER_ROLES.ADMIN]: {
    icon: ShieldCheck,
    portal: "Administrators",
    tagline: "Govern. Benchmark. Optimize.",
    description:
      "System-wide governance platform for municipal directors, ward commissioners, and city leadership.",
    features: [
      "Citywide executive analytics and incident trends",
      "Review department performance and SLA progress",
      "Manage user roles, credentials, and access rules",
      "Export municipal reports",
    ],
    action: "Executive Dashboard",
  },
};

const portalOrder: UserRole[] = [
  USER_ROLES.CITIZEN,
  USER_ROLES.MANAGER,
  USER_ROLES.STAFF,
  USER_ROLES.ADMIN,
];

export function RoleEcosystem() {
  return (
    <section
      aria-labelledby="portals-title"
      className="relative isolate scroll-mt-20 overflow-hidden bg-slate-50 py-20 dark:bg-signal-night sm:py-24"
      id="portals"
    >
      {/* সূক্ষ্ম ব্যাকগ্রাউন্ড গ্রিড ও অ্যাম্বিয়েন্ট গ্লো */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-sky-400/10 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
            <Sparkles aria-hidden="true" className="h-3 w-3" />
            <span>Portals &amp; access</span>
          </div>
          <h2
            className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
            id="portals-title"
          >
            Our Dedicated{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              Portals
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            One connected city. Four dedicated operational portals. Seamless
            role-based access for citizens, dispatchers, field crews, and city
            leadership.
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portalOrder.map((role) => {
            const {
              icon: Icon,
              portal,
              tagline,
              description,
              features,
              action,
            } = roleDetails[role];
            const isFeatured = role === USER_ROLES.MANAGER;

            return (
              <article
                className={`relative flex h-full flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10 ${
                  isFeatured
                    ? "border-sky-400/60 bg-slate-900 text-white shadow-lg shadow-sky-500/10 dark:border-sky-400/50 dark:bg-slate-900/95"
                    : "border-slate-200/90 bg-white text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100 dark:backdrop-blur-md"
                }`}
                key={role}
              >
                {isFeatured ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sky-400 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-950 shadow-sm">
                    Core dispatch hub
                  </span>
                ) : null}
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                    isFeatured
                      ? "bg-sky-400/15 text-sky-300"
                      : "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300"
                  }`}
                >
                  {role === USER_ROLES.CITIZEN
                    ? "Public portal"
                    : role === USER_ROLES.MANAGER
                      ? "Dispatch hub"
                      : role === USER_ROLES.STAFF
                        ? "Field crew"
                        : "Govtech BI"}
                </span>
                <div className="mt-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold leading-tight">
                      {portal}
                    </h3>
                    <p
                      className={`mt-1 text-[11px] font-semibold ${
                        isFeatured
                          ? "text-sky-300"
                          : "text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {tagline}
                    </p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 ${
                      isFeatured
                        ? "text-sky-400"
                        : "text-sky-600 dark:text-sky-400"
                    }`}
                  />
                </div>
                <p
                  className={`mt-3 min-h-[4.5rem] text-xs leading-5 ${
                    isFeatured
                      ? "text-slate-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {description}
                </p>
                <div
                  className={`my-4 border-t ${
                    isFeatured
                      ? "border-white/15"
                      : "border-slate-200/80 dark:border-white/10"
                  }`}
                />
                <h4
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                    isFeatured
                      ? "text-slate-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  What&apos;s included:
                </h4>
                <ul className="mt-3 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li
                      className={`flex gap-2 text-[11px] leading-[1.45] ${
                        isFeatured
                          ? "text-slate-100"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                      key={feature}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-px font-bold ${
                          isFeatured
                            ? "text-sky-400"
                            : "text-sky-600 dark:text-sky-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  aria-label={`${action} (coming soon)`}
                  className={`mt-5 inline-flex min-h-10 items-center justify-between gap-2 rounded-full px-3.5 py-2 text-[11px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isFeatured
                      ? "bg-sky-400 text-slate-950 hover:bg-sky-300 focus-visible:outline-white"
                      : "bg-slate-900 text-sky-300 hover:bg-sky-500 hover:text-slate-950 focus-visible:outline-sky-400 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-sky-400 dark:hover:text-slate-950"
                  } cursor-not-allowed opacity-75`}
                  disabled
                  title="Portal access will be enabled when dashboards are ready."
                  type="button"
                >
                  {action}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}