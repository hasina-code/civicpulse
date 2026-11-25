const comparisons = [
  {
    aspect: "Reporting",
    traditional: "Concerns can arrive through disconnected channels.",
    civicPulse: "Reports follow one consistent submission process.",
  },
  {
    aspect: "Ownership",
    traditional: "Responsibility may be difficult to track across teams.",
    civicPulse: "Reports are reviewed and routed to a responsible department.",
  },
  {
    aspect: "Work updates",
    traditional: "Progress may be hard for residents and teams to follow.",
    civicPulse: "Work moves through a shared, defined status lifecycle.",
  },
  {
    aspect: "Operational view",
    traditional: "Planning can depend on scattered updates.",
    civicPulse: "Authorized teams can review service trends and workloads.",
  },
];

export function ComparisonTable() {
  return (
    <section
      aria-labelledby="comparison-title"
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="comparison"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            A more connected approach
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="comparison-title"
          >
            From manual handoffs to a shared workflow.
          </h2>
        </div>
        <div className="mt-9 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-signal-navy">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr className="bg-signal-navy text-white">
                <th className="px-5 py-4 text-sm font-semibold" scope="col">
                  Service area
                </th>
                <th className="px-5 py-4 text-sm font-semibold" scope="col">
                  Manual reporting
                </th>
                <th className="px-5 py-4 text-sm font-semibold" scope="col">
                  CivicPulse
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr
                  className="border-t border-slate-200 dark:border-slate-800"
                  key={row.aspect}
                >
                  <th
                    className="px-5 py-4 text-sm font-semibold text-signal-navy dark:text-signal-cream"
                    scope="row"
                  >
                    {row.aspect}
                  </th>
                  <td className="px-5 py-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {row.traditional}
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {row.civicPulse}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
