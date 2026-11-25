import {
  BarChart3,
  Clock3,
  Gauge,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const insights: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: BarChart3,
    title: "Service trends",
    description:
      "Review issue activity over time and understand changing service needs.",
  },
  {
    icon: Clock3,
    title: "Resolution timelines",
    description:
      "Monitor how work moves through review, assignment, and resolution.",
  },
  {
    icon: UsersRound,
    title: "Department workload",
    description:
      "See how work is distributed across departments and field teams.",
  },
  {
    icon: Gauge,
    title: "Operational oversight",
    description:
      "Use consistent reporting to support planning and accountable service.",
  },
];

export function ExecutiveInsights() {
  return (
    <section
      aria-labelledby="executive-insights-title"
      className="scroll-mt-20 bg-white py-20 dark:bg-signal-night sm:py-24"
      id="features"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            Better operational visibility
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="executive-insights-title"
          >
            Make service decisions with a clearer picture.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            CivicPulse brings service activity into one place so authorized
            city teams can review trends, workloads, and progress without
            relying on disconnected updates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map(({ icon: Icon, title, description }) => (
            <article
              className="rounded-2xl border border-slate-200 bg-signal-cream p-5 dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
              key={title}
            >
              <Icon
                aria-hidden="true"
                className="h-6 w-6 text-signal-blue"
              />
              <h3 className="mt-4 font-semibold text-signal-navy dark:text-signal-cream">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
