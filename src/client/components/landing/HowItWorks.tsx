import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  HardHat,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Report an Issue",
    description:
      "Residents report infrastructure problems and share photos of local concerns.",
    image: "/images/step-report.jpg",
    icon: Send,
    tag: "Share Your Concern",
    phase: "Citizen Action",
  },
  {
    number: "02",
    title: "Location Verification",
    description:
      "The reported issue is identified and verified using its submitted location.",
    image: "/images/step-location.jpg",
    icon: MapPin,
    tag: "Verify Location",
    phase: "Geo-Pinning",
  },
  {
    number: "03",
    title: "City Team Reviews",
    description:
      "The responsible department reviews the report and determines the next action.",
    image: "/images/step-review.jpg",
    icon: ClipboardCheck,
    tag: "Review & Verify",
    phase: "Triage",
  },
  {
    number: "04",
    title: "Work Assignment",
    description:
      "Department managers assign the task to the appropriate maintenance team.",
    image: "/images/step-assignment.jpg",
    icon: ClipboardList,
    tag: "Assign the Work",
    phase: "Dispatch",
  },
  {
    number: "05",
    title: "Maintenance Work",
    description:
      "City workers take action to repair and improve public infrastructure.",
    image: "/images/step-work.jpg",
    icon: HardHat,
    tag: "Take Action",
    phase: "Field Execution",
  },
  {
    number: "06",
    title: "Issue Resolution",
    description:
      "Residents can follow updates and see when the reported issue is resolved.",
    image: "/images/step-progress.jpg",
    icon: CheckCircle2,
    tag: "See the Results",
    phase: "Completed",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="workflow-title"
      className="relative isolate scroll-mt-20 overflow-hidden bg-slate-50 py-24 dark:bg-signal-night sm:py-32"
      id="workflow"
    >
      {/* ব্যাকগ্রাউন্ড অ্যাম্বিয়েন্ট গ্লো ও সূক্ষ্ম গ্রিড প্যাটার্ন */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] dark:opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 -z-10 h-96 w-96 rounded-full bg-sky-400/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-24 -z-10 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* সেকশন হেডার */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-1.5 backdrop-blur-sm dark:border-sky-400/30 dark:bg-sky-400/10">
            <Sparkles
              aria-hidden="true"
              className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
            />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">
              How It Works
            </span>
          </div>

          <h2
            className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl"
            id="workflow-title"
          >
            From Your Voice to{" "}
            <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
              Real City Improvements.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            Discover how CivicPulse connects residents with city teams through a
            transparent 6-step workflow that turns local concerns into lasting
            results.
          </p>
        </div>

        {/* ৬টি ফুল-ইমেজ কার্ড গ্রিড */}
        <ol className="mt-16 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLastStep = index === steps.length - 1;

            return (
              <li
                className="group relative min-h-[26rem] overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-400/60 hover:shadow-2xl hover:shadow-sky-500/15 dark:border-white/10 dark:hover:border-sky-400/40"
                key={step.number}
              >
                {/* পুরো কার্ডজুড়ে ইমেজ */}
                <Image
                  alt={step.title}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  src={step.image}
                />

                {/* টেক্সট স্পষ্ট রাখার জন্য ডার্ক গ্রেডিয়েন্ট ওভারলে */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/25 transition-opacity duration-300 group-hover:via-slate-950/75"
                />

                {/* কার্ডের ভেতরের লেআউট */}
                <div className="relative z-10 flex h-full flex-col justify-between p-6">
                  {/* উপরের অংশ: স্টেপ নম্বর ও ফেজ ব্যাজ */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-slate-950/65 font-mono text-sm font-bold text-white shadow-lg backdrop-blur-md transition-colors group-hover:border-sky-400/70 group-hover:text-sky-300">
                      {step.number}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-md ${
                        isLastStep
                          ? "border-emerald-400/35 bg-emerald-950/75 text-emerald-300"
                          : "border-white/15 bg-slate-950/65 text-slate-200"
                      }`}
                    >
                      {step.phase}
                    </span>
                  </div>

                  {/* নিচের অংশ: আইকন ট্যাগ, শিরোনাম ও বিবরণ */}
                  <div className="mt-16">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${
                          isLastStep
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-sky-400 text-slate-950"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
                        {step.tag}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-sky-300">
                        {step.title}
                      </h3>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-300"
                      />
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-200/90">
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* নিচের অ্যাকশন ব্যানার */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-white to-amber-500/10 p-7 shadow-sm dark:border-white/10 dark:from-sky-500/10 dark:via-slate-900/90 dark:to-amber-500/10 sm:flex-row sm:px-9">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/15 text-sky-600 dark:text-sky-300">
              <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                Every Report Makes a Difference.
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Your participation helps build a cleaner, safer, and
                better-connected city.
              </p>
            </div>
          </div>

          <Link
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 dark:bg-sky-400 dark:hover:bg-sky-300"
            href="/report"
          >
            Submit a Report
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}