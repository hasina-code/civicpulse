import { Building2, CircleUserRound, Waypoints } from "lucide-react";

const participants = [
  {
    icon: CircleUserRound,
    title: "Residents",
    description:
      "Share local infrastructure concerns and keep track of their reports.",
  },
  {
    icon: Building2,
    title: "City departments",
    description:
      "Review incoming reports and coordinate the teams responsible for service.",
  },
  {
    icon: Waypoints,
    title: "One connected process",
    description:
      "Keep reporting, field work, and progress updates in a shared workflow.",
  },
];

export function PlatformOverview() {
  return (
    <section
      aria-labelledby="platform-overview-title"
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="about"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            About CivicPulse
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="platform-overview-title"
          >
            City services work better when everyone is connected.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            CivicPulse is a civic infrastructure platform for reporting,
            reviewing, assigning, and resolving public service issues. It gives
            residents and municipal teams a clearer way to work together.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {participants.map(({ icon: Icon, title, description }) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
              key={title}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-signal-blue/10 text-signal-blue">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-signal-navy dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
