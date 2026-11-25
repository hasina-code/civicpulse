import {
  Accessibility,
  Construction,
  Droplets,
  Lightbulb,
  Trash2,
  Trees,
  type LucideIcon,
} from "lucide-react";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABELS,
  CATEGORY_DEPARTMENT_MAP,
  type IssueCategory,
} from "../../../shared/constants/categories";

const categoryIcons: Record<IssueCategory, LucideIcon> = {
  ROAD_DAMAGE: Construction,
  STREETLIGHT: Lightbulb,
  DRAINAGE: Droplets,
  FOOTPATH: Accessibility,
  WASTE_MANAGEMENT: Trash2,
  PUBLIC_INFRASTRUCTURE: Trees,
};

export function CategoryGrid() {
  return (
    <section
      aria-labelledby="services-title"
      className="scroll-mt-20 bg-white py-20 dark:bg-signal-night sm:py-24"
      id="services"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            City services
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="services-title"
          >
            Help improve the places we share.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Report concerns across the public infrastructure and essential
            services that keep a city moving.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ISSUE_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category];

            return (
              <article
                className="flex gap-4 rounded-2xl border border-slate-200 bg-signal-cream p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-signal-navy dark:text-slate-100"
                key={category}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-signal-gold/30 text-signal-navy dark:text-signal-gold">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-semibold text-signal-navy dark:text-signal-cream">
                    {ISSUE_CATEGORY_LABELS[category]}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Routed to {CATEGORY_DEPARTMENT_MAP[category]} for review.
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
