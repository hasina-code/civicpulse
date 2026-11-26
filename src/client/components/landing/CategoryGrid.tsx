"use client";

import { useRef } from "react";
import {
  Accessibility,
  ArrowUpRight,
  ChevronsLeft,
  ChevronsRight,
  Construction,
  Droplets,
  Lightbulb,
  Trash2,
  Trees,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

const categoryImages: Record<IssueCategory, string> = {
  ROAD_DAMAGE: "/images/categories/road-damage.jpg",
  STREETLIGHT: "/images/categories/streetlight.jpg",
  DRAINAGE: "/images/categories/drainage.jpg",
  FOOTPATH: "/images/categories/footpath.jpg",
  WASTE_MANAGEMENT: "/images/categories/waste-management.jpg",
  PUBLIC_INFRASTRUCTURE: "/images/categories/public-infrastructure.jpg",
};

export function CategoryGrid() {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const handleSlide = (direction: "prev" | "next") => {
    const container = sliderRef.current;
    if (!container) return;

    const scrollAmount = 340;
    container.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-labelledby="services-title"
      className="scroll-mt-20 bg-white py-20 dark:bg-signal-night sm:py-28"
      id="services"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
      
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
              City Services
            </span>
            <h2
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
              id="services-title"
            >
              Help improve the places{" "}
              <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                we share.
              </span>
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
              Report concerns across the public infrastructure and essential
              services that keep a city moving.
            </p>
          </div>


          <div className="flex items-center gap-3 self-start sm:self-end">
            <button
              aria-label="Previous service"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-500 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-400 dark:hover:text-slate-950"
              onClick={() => handleSlide("prev")}
              type="button"
            >
              <ChevronsLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              aria-label="Next service"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-500 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-sky-400 dark:hover:text-slate-950"
              onClick={() => handleSlide("next")}
              type="button"
            >
              <ChevronsRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

  
        <div
          className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={sliderRef}
        >
          {ISSUE_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category];
            const imageSrc = categoryImages[category];

            return (
              <Link
                className="group relative flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-500/10 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-400/40 sm:w-80"
                href={`/report?category=${category}`}
                key={category}
              >
                {/* ওপরের ইমেজ অংশ */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                  <Image
                    alt={ISSUE_CATEGORY_LABELS[category]}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                    sizes="320px"
                    src={imageSrc}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"
                  />

                
                  <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/70 text-sky-300 backdrop-blur-md">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>

               
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
                      {ISSUE_CATEGORY_LABELS[category]}
                    </h3>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-500 dark:group-hover:text-sky-400"
                    />
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Handled by{" "}
                    <span className="text-slate-700 dark:text-slate-200">
                      {CATEGORY_DEPARTMENT_MAP[category]}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}