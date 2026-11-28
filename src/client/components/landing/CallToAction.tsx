import {
  ArrowRight,
  MessageCircleQuestion,
  Plus,
  Radio,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const frequentlyAskedQuestions = [
  {
    question: "What kinds of concerns can be reported?",
    answer:
      "CivicPulse supports reports about road damage, streetlights, drainage, footpaths, waste management, and public infrastructure.",
  },
  {
    question: "How do reports reach the right city team?",
    answer:
      "Reports are reviewed and routed to the department responsible for the selected service category.",
  },
  {
    question: "Can residents follow progress?",
    answer:
      "The report lifecycle is designed to make progress visible from submission and review through resolution and closure.",
  },
  {
    question: "Does CivicPulse replace emergency services?",
    answer:
      "No. For immediate danger or emergencies, contact the appropriate local emergency service directly.",
  },
];

export function CallToAction() {
  return (
    <>
      {/* FAQs সেকশন */}
      <section
        aria-labelledby="faqs-title"
        className="scroll-mt-20 border-t border-slate-200 bg-slate-50 py-20 dark:border-white/10 dark:bg-signal-night sm:py-28"
        id="faqs"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            {/* বাম কলাম: স্টিকি ইন্ট্রো */}
            <div className="lg:sticky lg:top-28">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300">
                <MessageCircleQuestion aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Citizen Support &amp; FAQs</span>
              </div>

              <h2
                className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[42px] lg:leading-[1.12]"
                id="faqs-title"
              >
                Answers for{" "}
                <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                  everyday
                </span>{" "}
                civic reporting.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Everything you need to know about submitting geotagged reports,
                department routing, and live resolution tracking.
              </p>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
                  Emergency Notice
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  CivicPulse handles non-emergency municipal maintenance. For
                  urgent life-safety incidents, call local emergency services
                  immediately.
                </p>
              </div>
            </div>

            {/* ডান কলাম: ক্লিন অ্যাকর্ডিয়ন কার্ড */}
            <div className="space-y-3.5">
              {frequentlyAskedQuestions.map(({ question, answer }, index) => (
                <details
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition open:border-sky-500/50 dark:border-white/10 dark:bg-slate-900 dark:open:border-sky-400/40"
                  key={question}
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 sm:px-6">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-500/10 font-mono text-[11px] font-bold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                        0{index + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400 sm:text-base">
                        {question}
                      </span>
                    </div>

                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition duration-200 group-open:rotate-45 group-open:border-sky-400/40 group-open:bg-sky-400/15 group-open:text-sky-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>

                  <div className="border-t border-slate-100 px-5 pb-5 pt-3.5 dark:border-white/10 sm:px-6 sm:pl-[66px]">
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA সেকশন — ক্লিন সলিড কার্ড */}
      <section
        aria-labelledby="contact-title"
        className="scroll-mt-20 bg-slate-50 pb-20 pt-4 dark:bg-signal-night sm:pb-28"
        id="contact"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-12 lg:p-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
                  <Radio aria-hidden="true" className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Municipal Rollout &amp; Contact</span>
                </div>

                <h2
                  className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[40px] lg:leading-[1.15]"
                  id="contact-title"
                >
                  Let&apos;s make city services{" "}
                  <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                    more responsive.
                  </span>
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  For local service availability or municipal rollout questions,
                  connect with your city administration or browse active civic
                  service channels.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3.5">
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-black text-slate-950 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:bg-sky-400 dark:hover:bg-sky-300"
                  href="/#services"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  Explore city services
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>

                <Link
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-5 text-sm font-bold text-slate-700 transition hover:border-sky-400 hover:text-sky-600 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-sky-400/40 dark:hover:text-white"
                  href="/citizen/issues/new"
                >
                  Report an issue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}