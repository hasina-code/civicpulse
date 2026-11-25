import { ArrowRight, MessageCircleQuestion } from "lucide-react";
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
      <section
        aria-labelledby="faqs-title"
        className="scroll-mt-20 bg-white py-20 dark:bg-signal-night sm:py-24"
        id="faqs"
      >
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal-blue/10 text-signal-blue">
              <MessageCircleQuestion aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
              FAQs
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
              id="faqs-title"
            >
              Common questions
            </h2>
          </div>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {frequentlyAskedQuestions.map(({ question, answer }) => (
              <details className="group py-5" key={question}>
                <summary className="cursor-pointer list-none pr-8 font-semibold text-signal-navy marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal-blue dark:text-signal-cream">
                  <span className="flex items-center justify-between gap-4">
                    {question}
                    <span
                      aria-hidden="true"
                      className="text-xl text-signal-blue transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="contact-title"
        className="scroll-mt-20 bg-signal-blue py-16 text-white sm:py-20"
        id="contact"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-gold">
              Contact
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
              id="contact-title"
            >
              Let&apos;s make city services more responsive.
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              For local service availability or municipal rollout questions,
              contact your city administration.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-signal-gold px-5 py-3 font-semibold text-signal-navy transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/#services"
          >
            Explore city services
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
