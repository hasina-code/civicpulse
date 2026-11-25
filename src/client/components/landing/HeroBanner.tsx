import { ArrowDown, ArrowRight, RadioTower } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type WorkflowStep = {
  step: string;
  label: string;
  image: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    step: "01",
    label: "A resident shares a concern",
    image: "/images/step-1.jpg",
  },
  {
    step: "02",
    label: "The right city team reviews it",
    image: "/images/step-2.jpg",
  },
  {
    step: "03",
    label: "Progress is tracked to resolution",
    image: "/images/step-3.jpg",
  },
];

export function HeroBanner() {
  return (
    <section
      className="relative isolate scroll-mt-20 overflow-hidden bg-signal-night text-white"
      id="home"
    >
      <video
        aria-hidden="true"
        autoPlay
        className="absolute inset-0 z-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        src="/videos/hero-banner.mp4"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-signal-night/95 via-slate-950/85 to-slate-900/75"
      />

      <div className="relative z-20 mx-auto grid min-h-[36rem] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[42rem] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-signal-gold backdrop-blur-sm">
            <RadioTower aria-hidden="true" className="h-4 w-4" />
            A clearer connection to city services
          </p>
          <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
            Better streets start with{" "}
            <span className="text-signal-gold">being heard.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            CivicPulse brings residents and city teams together to report
            infrastructure concerns, coordinate work, and follow progress from
            submission to resolution.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-signal-gold px-5 py-3 font-semibold text-signal-navy transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/#services"
            >
              Explore services
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-signal-night/30 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-gold"
              href="/#workflow"
            >
              See how it works
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div
          aria-label="A connected city workflow"
          className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-300/20 bg-slate-900/40 p-3 shadow-2xl shadow-black/30 backdrop-blur-sm"
          role="group"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                A connected city
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                From a community report to coordinated action
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
              CivicPulse
            </span>
          </div>
          <ol className="space-y-2 py-2">
            {workflowSteps.map((item) => (
              <li
                className="flex min-h-[4.25rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 sm:gap-3"
                key={item.step}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal-gold text-base font-bold text-signal-navy shadow-inner shadow-yellow-100/30 sm:h-12 sm:w-12 sm:text-lg">
                  {item.step}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-100">
                  {item.label}
                </span>
                <span className="relative block h-11 w-16 shrink-0 overflow-hidden rounded-xl sm:h-12 sm:w-[4.5rem]">
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="80px"
                    src={item.image}
                  />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
