"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, CircleUserRound, Waypoints } from "lucide-react";
import Image from "next/image";

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

export function AboutSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="platform-overview-title"
      className="relative scroll-mt-20 overflow-hidden bg-[#0c162b] py-16 text-white sm:py-20 lg:min-h-[680px] lg:py-24"
      id="about"
    >
      {/* Subtle subtle connector lines linking Left Cards to Right Photo Collage */}
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 hidden h-full w-full transition-opacity duration-1000 lg:block ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        preserveAspectRatio="none"
        viewBox="0 0 1200 680"
      >
        <path
          d="M 520 355 H 592 C 602 355 608 349 608 339 V 185 C 608 175 614 169 624 169 H 645"
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="1.5"
        />
        <path
          d="M 520 465 H 645"
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="1.5"
        />
        <path
          d="M 520 575 H 592 C 602 575 608 569 608 559 V 505 C 608 495 614 489 624 489 H 645"
          fill="none"
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Heading + External Glowing Icons with Vertical Line + Dark Cards */}
        <div
          className={`transition-all duration-700 ease-out lg:col-span-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b82e8]">
            ABOUT CIVICPULSE
          </p>

          <h2
            className="mt-3 max-w-[560px] text-[36px] font-extrabold leading-[1.14] tracking-tight text-white sm:text-[44px]"
            id="platform-overview-title"
          >
            City services{" "}
            <span className="text-[#1E90FF]">work better</span> when everyone is
            connected.
          </h2>

          <p className="mt-4 max-w-[540px] text-[15px] leading-7 text-slate-300/90 sm:text-[16px]">
            CivicPulse is a civic infrastructure platform for reporting,
            reviewing, assigning, and resolving public service issues. It gives
            residents and municipal teams a clearer way to work together.
          </p>

          {/* Connected Row List (Icon Outside on Left + Card on Right) */}
          <div className="relative mt-9">
            {/* Vertical Line connecting the 3 outer icon circles */}
            <div
              aria-hidden="true"
              className={`absolute bottom-11 left-[27px] top-11 w-px origin-top bg-slate-500/35 transition-transform duration-1000 ease-out ${
                isVisible ? "scale-y-100" : "scale-y-0"
              }`}
            />

            <div className="space-y-4">
              {participants.map(({ icon: Icon, title, description }, index) => {
                const isBlue = index === 1;

                return (
                  <article
                    key={title}
                    style={{ transitionDelay: `${(index + 1) * 150}ms` }}
                    className={`group relative flex items-center gap-5 transition-all duration-500 ${
                      isVisible
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-6 opacity-0"
                    }`}
                  >
                    {/* Outer Glowing Circle Badge (Outside the card on the left) */}
                    <div className="relative z-10 flex h-[54px] w-[54px] shrink-0 items-center justify-center">
                      {/* Soft outer halo */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${
                          isBlue
                            ? "bg-sky-500/35 opacity-85 group-hover:opacity-100"
                            : "bg-amber-400/30 opacity-80 group-hover:opacity-100"
                        }`}
                      />
                      {/* Double ring circle */}
                      <span
                        className={`relative flex h-[50px] w-[50px] items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${
                          isBlue
                            ? "border-sky-400/40 bg-[#132546] text-sky-400 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]"
                            : "border-amber-400/40 bg-[#272421] text-[#5b82e8] shadow-[0_0_0_4px_rgba(224,159,62,0.12)]"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                    </div>

                    {/* Separate Dark Translucent Card on the Right */}
                    <div className="flex-1 rounded-xl border border-white/10 bg-[#152038]/85 px-5 py-4 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:border-white/25 group-hover:bg-[#192642]">
                      <h3 className="text-[17px] font-bold leading-snug text-white">
                        {title}
                      </h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-slate-300/85">
                        {description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Exact 3-Photo Staggered Collage with Rounded Backdrop Frame */}
        <div
          aria-label="CivicPulse reporting, city operations, and field work"
          className="relative mx-auto w-full max-w-[560px] lg:col-span-6"
          role="group"
        >
          {/* Rounded translucent backdrop card behind the right side of the collage */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-10 right-0 top-10 hidden w-[75%] rounded-3xl border border-white/10 bg-[#15223d]/60 shadow-inner sm:block"
          />

          <div className="relative flex flex-col gap-4 sm:block sm:h-[540px]">
            {/* 1. Top-Left Photo: Resident reporting pothole */}
            <div
              style={{ transitionDelay: "200ms" }}
              className={`relative z-10 h-[215px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-700 ease-out sm:absolute sm:left-0 sm:top-0 sm:h-[230px] sm:w-[62%] ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-6 scale-95 opacity-0"
              }`}
            >
              <Image
                alt="Resident photographing a road concern with a phone"
                className="object-cover transition-transform duration-700 hover:scale-105"
                fill
                sizes="(max-width: 640px) 100vw, 348px"
                src="/images/step-1.jpg"
              />
            </div>

            {/* 2. Middle-Right Overlapping Photo: City operations control room */}
            <div
              style={{ transitionDelay: "350ms" }}
              className={`relative z-20 h-[205px] w-full overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.65)] transition-all duration-700 ease-out sm:absolute sm:right-0 sm:top-[155px] sm:h-[225px] sm:w-[60%] ${
                isVisible
                  ? "translate-x-0 scale-100 opacity-100"
                  : "translate-x-8 scale-95 opacity-0"
              }`}
            >
              <Image
                alt="City operations team monitoring a connected map"
                className="object-cover transition-transform duration-700 hover:scale-105"
                fill
                sizes="(max-width: 640px) 100vw, 336px"
                src="/images/step-2.jpg"
              />
            </div>

            {/* 3. Bottom-Left Photo: Municipal road maintenance crew at night */}
            <div
              style={{ transitionDelay: "500ms" }}
              className={`relative z-10 h-[215px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-700 ease-out sm:absolute sm:bottom-0 sm:left-[2%] sm:h-[225px] sm:w-[62%] ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-8 scale-95 opacity-0"
              }`}
            >
              <Image
                alt="Field crew repairing public infrastructure at night"
                className="object-cover transition-transform duration-700 hover:scale-105"
                fill
                sizes="(max-width: 640px) 100vw, 348px"
                src="/images/step-3.jpg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}