import {
  ClipboardCheck,
  ClipboardList,
  HardHat,
  Send,
  type LucideIcon,
} from "lucide-react";

const steps: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    number: "01",
    title: "Submit a report",
    description:
      "Describe the public infrastructure concern and share where it needs attention.",
    icon: Send,
  },
  {
    number: "02",
    title: "City team reviews",
    description:
      "The responsible department checks the report and determines the next action.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Work is coordinated",
    description:
      "A department manager assigns the work to an appropriate maintenance team.",
    icon: ClipboardList,
  },
  {
    number: "04",
    title: "Progress is followed",
    description:
      "Teams record their progress and the report moves through to resolution.",
    icon: HardHat,
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="workflow-title"
      className="scroll-mt-20 bg-signal-cream py-20 dark:bg-signal-night sm:py-24"
      id="workflow"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            How it works
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="workflow-title"
          >
            From a local concern to coordinated city action.
          </h2>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <li
              className="relative rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
              key={number}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-wider text-signal-blue">
                  STEP {number}
                </span>
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6 text-signal-navy dark:text-slate-100"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-signal-navy dark:text-slate-100">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
