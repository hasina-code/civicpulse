import {
  ArrowRight,
  BriefcaseBusiness,
  HardHat,
  ShieldCheck,
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
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="portals"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-signal-blue/20 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-signal-blue dark:border-signal-blue/40 dark:bg-signal-navy dark:text-slate-100">
            Portals &amp; access
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="portals-title"
          >
            Our Dedicated Portals
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
                className={`relative flex h-full flex-col rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isFeatured
                    ? "border-signal-gold bg-signal-navy text-white shadow-lg"
                    : "border-slate-200 bg-white text-signal-navy dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
                }`}
                key={role}
              >
                {isFeatured ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-signal-gold px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-signal-navy">
                    Core dispatch hub
                  </span>
                ) : null}
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                    isFeatured
                      ? "bg-white/15 text-signal-gold"
                      : "bg-slate-100 text-signal-blue dark:bg-slate-800 dark:text-blue-300"
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
                    <p className="mt-1 text-[11px] font-semibold text-amber-500 dark:text-signal-gold">
                      {tagline}
                    </p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 ${
                      isFeatured ? "text-signal-gold" : "text-signal-blue"
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
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                <h4
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                    isFeatured
                      ? "text-slate-200"
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
                          isFeatured ? "text-signal-gold" : "text-signal-blue"
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
                      ? "bg-signal-gold text-signal-navy hover:bg-yellow-300 focus-visible:outline-white"
                      : "bg-signal-navy text-signal-gold hover:bg-signal-blue focus-visible:outline-signal-blue dark:bg-slate-800 dark:hover:bg-signal-blue"
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
