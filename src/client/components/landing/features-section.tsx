import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

type PreviewVariant =
  | "reporting"
  | "map"
  | "teams"
  | "analytics"
  | "notifications"
  | "security";

interface FeatureItem {
  number: string;
  title: string;
  description: string;
  tag: string;
  icon: LucideIcon;
  preview: PreviewVariant;
}

const features: FeatureItem[] = [
  {
    number: "01",
    title: "Easy Issue Reporting",
    description:
      "Report road damage, broken streetlights, drainage and waste problems with photos, address and GPS coordinates.",
    tag: "Citizen Portal",
    icon: ClipboardList,
    preview: "reporting",
  },
  {
    number: "02",
    title: "Interactive City Map",
    description:
      "See reported issues on a map with category markers, location filters and nearby issue detection.",
    tag: "Geo-Intelligence",
    icon: MapPin,
    preview: "map",
  },
  {
    number: "03",
    title: "Department & Team Management",
    description:
      "Verify reports, set priorities, assign field crews and keep track of each team's workload.",
    tag: "Dispatch & Ops",
    icon: Users,
    preview: "teams",
  },
  {
    number: "04",
    title: "Analytics Dashboard",
    description:
      "Follow monthly trends, resolution time, category distribution and department performance.",
    tag: "Live Metrics",
    icon: BarChart3,
    preview: "analytics",
  },
  {
    number: "05",
    title: "Notifications & History",
    description:
      "Stay informed about updates, with every status change recorded with its user and timestamp.",
    tag: "Audit Trail",
    icon: Bell,
    preview: "notifications",
  },
  {
    number: "06",
    title: "Role-Based Security",
    description:
      "Separate access for Citizens, Staff, Department Managers and Admins, enforced on the server.",
    tag: "Access Control",
    icon: ShieldCheck,
    preview: "security",
  },
];

function MiniReportingPreview() {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="inline-flex items-center gap-1.5 font-mono text-slate-300">
          <Camera aria-hidden="true" className="h-3 w-3 text-sky-400" />
          3 photos + GPS pinned
        </span>
        <span className="rounded bg-sky-400/15 px-1.5 py-0.5 font-mono text-sky-300">
          23.81°N
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/90 px-2.5 py-1.5 text-[11px] text-slate-200">
        <span className="truncate font-medium">Pothole · Sector 7</span>
        <span className="font-mono text-[10px] text-sky-400">Ready</span>
      </div>
    </div>
  );
}

function MiniMapPreview() {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-[radial-gradient(rgba(56,189,248,0.18)_1px,transparent_1px)] [background-size:14px_14px]">
        <span className="absolute left-[22%] top-[34%] h-2.5 w-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/25" />
        <span className="absolute left-[58%] top-[28%] h-2.5 w-2.5 rounded-full bg-sky-300 ring-4 ring-sky-400/25" />
        <span className="absolute left-[46%] top-[66%] h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/25" />
        <span className="absolute left-[76%] top-[60%] h-2 w-2 rounded-full bg-sky-400" />
        <div className="absolute bottom-1.5 right-2 rounded-md border border-white/10 bg-slate-900/90 px-2 py-0.5 font-mono text-[10px] text-sky-300">
          4 active pins
        </div>
      </div>
    </div>
  );
}

function MiniTeamsPreview() {
  const crews = [
    { name: "Roads Crew A", load: "w-4/5", count: "8 tasks" },
    { name: "Lighting Unit", load: "w-3/5", count: "5 tasks" },
  ];

  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      {crews.map((crew) => (
        <div key={crew.name}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-slate-200">{crew.name}</span>
            <span className="font-mono text-slate-400">{crew.count}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full bg-sky-400 ${crew.load}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniAnalyticsPreview() {
  const bars = [
    { label: "W1", height: "h-7", tone: "bg-sky-400/45" },
    { label: "W2", height: "h-10", tone: "bg-sky-400/65" },
    { label: "W3", height: "h-8", tone: "bg-sky-400/55" },
    { label: "W4", height: "h-12", tone: "bg-sky-400/85" },
    { label: "W5", height: "h-14", tone: "bg-sky-400" },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="inline-flex items-center gap-1 font-mono text-slate-400">
          <Activity aria-hidden="true" className="h-3 w-3 text-sky-400" />
          Resolution Rate
        </span>
        <span className="font-mono font-semibold text-sky-400">+24%</span>
      </div>
      <div className="flex h-14 items-end justify-between gap-2 px-1">
        {bars.map((bar) => (
          <div className="flex flex-1 flex-col items-center gap-1" key={bar.label}>
            <div
              className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 ${bar.height} ${bar.tone}`}
            />
            <span className="font-mono text-[9px] text-slate-400">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniNotificationsPreview() {
  return (
    <div className="mt-4 space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      <div className="flex items-center justify-between text-[11px] text-slate-200">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-sky-400" />
          <span>#CP-1031 marked Resolved</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">2m</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate">Assigned to Electrical Dept.</span>
        <span className="font-mono text-[10px] text-slate-500">14m</span>
      </div>
    </div>
  );
}

function MiniSecurityPreview() {
  const roles = ["CITIZEN", "STAFF", "ADMIN"];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-950 p-3 dark:border-white/10">
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1 font-mono">
          <KeyRound aria-hidden="true" className="h-3 w-3 text-sky-400" />
          Server-enforced scopes
        </span>
        <span className="font-mono text-sky-400">RBAC</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <span
            className="rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300"
            key={role}
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-heading"
      className="relative isolate scroll-mt-20 overflow-hidden bg-slate-50 py-24 dark:bg-signal-night sm:py-28"
      id="features"
    >
      {/* সূক্ষ্ম ব্যাকগ্রাউন্ড গ্রিড ও অ্যাম্বিয়েন্ট গ্লো */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-20 -z-10 h-80 w-80 rounded-full bg-sky-400/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-20 -z-10 h-80 w-80 rounded-full bg-sky-500/10 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* সেকশন হেডার */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-1.5 backdrop-blur-sm dark:border-sky-400/30 dark:bg-sky-400/10">
            <Sparkles
              aria-hidden="true"
              className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
            />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              Platform Features
            </span>
          </div>

          <h2
            className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl"
            id="features-heading"
          >
            Everything your city needs to{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              fix issues faster.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            CivicPulse connects residents, government departments, and
            maintenance teams in one unified civic operations platform.
          </p>
        </div>

        {/* ফিচার কার্ড গ্রিড */}
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(
            ({ number, title, description, tag, icon: Icon, preview }) => (
              <li
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-400/60 hover:shadow-2xl hover:shadow-sky-500/10 motion-reduce:transform-none dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md dark:hover:border-sky-400/40"
                key={title}
              >
                {/* হোভারে সূক্ষ্ম কর্নার গ্লো */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-sky-400/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />

                <div>
                  {/* ওপরের বার: আইকন বক্স ও ক্যাটাগরি ট্যাগ */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10 text-sky-600 transition-all duration-300 group-hover:bg-sky-400 group-hover:text-slate-950 dark:bg-sky-400/10 dark:text-sky-400 dark:group-hover:text-slate-950">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>

                    <span className="rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      {tag}
                    </span>
                  </div>

                  {/* শিরোনাম ও বিবরণ */}
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
                    {title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>

                  {/* প্রতিটি কার্ডের মিনি UI প্রিভিউ */}
                  {preview === "reporting" && <MiniReportingPreview />}
                  {preview === "map" && <MiniMapPreview />}
                  {preview === "teams" && <MiniTeamsPreview />}
                  {preview === "analytics" && <MiniAnalyticsPreview />}
                  {preview === "notifications" && <MiniNotificationsPreview />}
                  {preview === "security" && <MiniSecurityPreview />}
                </div>

                {/* কার্ড ফুটার */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                  <span className="font-mono text-xs font-semibold tracking-widest text-slate-400 dark:text-slate-500">
                    FEATURE {number}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-500 dark:text-slate-500 dark:group-hover:text-sky-400"
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}