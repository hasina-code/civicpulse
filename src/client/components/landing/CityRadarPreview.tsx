"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Radio,
  Wrench,
} from "lucide-react";
import Link from "next/link";

type IssueStatus = "ALL" | "REPORTED" | "IN_PROGRESS" | "RESOLVED";

interface RadarPin {
  id: string;
  code: string;
  title: string;
  category: string;
  location: string;
  status: Exclude<IssueStatus, "ALL">;
  updatedAt: string;
  department: string;
  x: number;
  y: number;
}

const RADAR_PINS: RadarPin[] = [
  {
    id: "pin-1",
    code: "CP-1042",
    title: "Broken Streetlight & Dark Crosswalk",
    category: "Streetlight",
    location: "Sector 7, Lakeview Avenue",
    status: "IN_PROGRESS",
    updatedAt: "12 mins ago",
    department: "Electrical & Lighting Dept.",
    x: 28,
    y: 34,
  },
  {
    id: "pin-2",
    code: "CP-1039",
    title: "Deep Asphalt Pothole Near Bus Bay",
    category: "Road Damage",
    location: "Central Station Road",
    status: "REPORTED",
    updatedAt: "26 mins ago",
    department: "Roads & Highways Division",
    x: 64,
    y: 26,
  },
  {
    id: "pin-3",
    code: "CP-1031",
    title: "Blocked Storm Drain Cleared",
    category: "Drainage",
    location: "Greenfield South Block",
    status: "RESOLVED",
    updatedAt: "1 hour ago",
    department: "Water & Drainage Authority",
    x: 52,
    y: 66,
  },
  {
    id: "pin-4",
    code: "CP-1028",
    title: "Damaged Tactile Footpath Ramp",
    category: "Footpath",
    location: "Civic Plaza East Gate",
    status: "IN_PROGRESS",
    updatedAt: "2 hours ago",
    department: "Urban Accessibility Cell",
    x: 76,
    y: 58,
  },
  {
    id: "pin-5",
    code: "CP-1019",
    title: "Overflowing Public Waste Bin Emptied",
    category: "Waste Management",
    location: "Riverside Park North",
    status: "RESOLVED",
    updatedAt: "3 hours ago",
    department: "City Sanitation Services",
    x: 34,
    y: 72,
  },
];

const STATUS_META: Record<
  Exclude<IssueStatus, "ALL">,
  {
    label: string;
    dotColor: string;
    ringColor: string;
    badgeClass: string;
  }
> = {
  REPORTED: {
    label: "Reported",
    dotColor: "bg-amber-400",
    ringColor: "bg-amber-400/30",
    badgeClass:
      "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotColor: "bg-sky-400",
    ringColor: "bg-sky-400/30",
    badgeClass:
      "border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-300",
  },
  RESOLVED: {
    label: "Resolved",
    dotColor: "bg-emerald-400",
    ringColor: "bg-emerald-400/30",
    badgeClass:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
  },
};

export function CityRadarPreview() {
  const [selectedFilter, setSelectedFilter] = useState<IssueStatus>("ALL");
  const [activePinId, setActivePinId] = useState<string>(RADAR_PINS[0].id);

  const visiblePins =
    selectedFilter === "ALL"
      ? RADAR_PINS
      : RADAR_PINS.filter((pin) => pin.status === selectedFilter);

  const activePin =
    visiblePins.find((pin) => pin.id === activePinId) ??
    visiblePins[0] ??
    RADAR_PINS[0];

  const counts = {
    ALL: RADAR_PINS.length,
    REPORTED: RADAR_PINS.filter((p) => p.status === "REPORTED").length,
    IN_PROGRESS: RADAR_PINS.filter((p) => p.status === "IN_PROGRESS").length,
    RESOLVED: RADAR_PINS.filter((p) => p.status === "RESOLVED").length,
  };

  return (
    <section
      aria-labelledby="city-radar-title"
      className="relative isolate scroll-mt-20 overflow-hidden bg-white py-14 dark:bg-signal-night sm:py-20"
      id="radar"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* সেকশন হেডার */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 dark:border-sky-400/30 dark:bg-sky-400/10">
              <Radio
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-pulse text-sky-600 dark:text-sky-400"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
                Live City Radar
              </span>
            </div>

            <h2
              className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl"
              id="city-radar-title"
            >
              Real-time pulse of{" "}
              <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
                every neighborhood.
              </span>
            </h2>

            <p className="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Explore active civic reports, filter by status, and track live
              updates across the city.
            </p>
          </div>

          {/* স্ট্যাটাস ফিল্টার বাটনসমূহ */}
          <div
            aria-label="Filter radar reports by status"
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
          >
            {(
              [
                { key: "ALL", label: "All" },
                { key: "REPORTED", label: "Reported" },
                { key: "IN_PROGRESS", label: "In Progress" },
                { key: "RESOLVED", label: "Resolved" },
              ] as const
            ).map((tab) => {
              const isSelected = selectedFilter === tab.key;
              return (
                <button
                  aria-selected={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "border-sky-400 bg-sky-500 text-slate-950 shadow-sm dark:bg-sky-400"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-400/50 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white"
                  }`}
                  key={tab.key}
                  onClick={() => {
                    setSelectedFilter(tab.key);
                    const nextList =
                      tab.key === "ALL"
                        ? RADAR_PINS
                        : RADAR_PINS.filter((p) => p.status === tab.key);
                    if (nextList.length > 0) {
                      setActivePinId(nextList[0].id);
                    }
                  }}
                  role="tab"
                  type="button"
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                      isSelected
                        ? "bg-slate-950/15 text-slate-950"
                        : "bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* মেইন রাডার গ্রিড */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* বাম পাশ: কমপ্যাক্ট রাডার ক্যানভাস */}
          <div className="relative flex min-h-[20rem] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-5 shadow-lg dark:border-white/10 lg:col-span-7 sm:min-h-[22.5rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.08)_1px,transparent_1px)] [background-size:32px_32px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-sky-400/15"
            />

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
              fill="none"
              viewBox="0 0 600 360"
            >
              <path
                d="M-20 100 Q 180 125, 310 75 T 630 120"
                stroke="#38bdf8"
                strokeDasharray="6 6"
                strokeWidth="1.5"
              />
              <path
                d="M100 -10 L 230 370"
                stroke="#94a3b8"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <path
                d="M420 -10 L 340 370"
                stroke="#94a3b8"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <path
                d="M-10 250 Q 260 205, 620 265"
                stroke="#94a3b8"
                strokeOpacity="0.4"
                strokeWidth="2"
              />
            </svg>

            {/* টপ স্ট্যাটাস বার */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Live Grid · Metro 04</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] text-sky-300 backdrop-blur-md">
                <Layers aria-hidden="true" className="h-3 w-3" />
                <span>{visiblePins.length} Pins</span>
              </div>
            </div>

            {/* রাডার পিনসমূহ */}
            <div className="relative my-2 flex-1">
              {visiblePins.map((pin) => {
                const isSelected = pin.id === activePin.id;
                const meta = STATUS_META[pin.status];

                return (
                  <button
                    aria-label={`${pin.title} (${meta.label})`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    key={pin.id}
                    onClick={() => setActivePinId(pin.id)}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -inset-2 rounded-full transition-transform duration-300 ${
                        meta.ringColor
                      } ${isSelected ? "scale-125 animate-ping" : "scale-90 opacity-60 group-hover:scale-110"}`}
                    />
                    <span
                      className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 shadow-md transition-transform duration-200 ${
                        meta.dotColor
                      } ${isSelected ? "scale-125 ring-4 ring-white/25" : "group-hover:scale-110"}`}
                    />
                    <span
                      className={`mt-1 block whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold backdrop-blur-md transition ${
                        isSelected
                          ? "border-sky-400/60 bg-slate-900/95 text-white"
                          : "border-white/10 bg-slate-900/75 text-slate-300 opacity-85 group-hover:opacity-100"
                      }`}
                    >
                      {pin.code}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* বটম লেজেন্ড */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-slate-300">
              <div className="flex items-center gap-3.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Reported
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  In Progress
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Resolved
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Select a pin
              </span>
            </div>
          </div>

          {/* ডান পাশ: ডিটেইল কার্ড এবং কমপ্যাক্ট ফিড */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                  #{activePin.code} · {activePin.category}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    STATUS_META[activePin.status].badgeClass
                  }`}
                >
                  {STATUS_META[activePin.status].label}
                </span>
              </div>

              <h3 className="mt-2.5 text-lg font-bold text-slate-900 dark:text-white">
                {activePin.title}
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                <div className="flex items-center gap-2">
                  <MapPin
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-sky-500 dark:text-sky-400"
                  />
                  <span>{activePin.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400"
                  />
                  <span>{activePin.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  />
                  <span>Updated {activePin.updatedAt}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end border-t border-slate-200/80 pt-3 dark:border-white/10">
                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
                  href="/issues"
                >
                  Open Live Map
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* কমপ্যাক্ট সাম্প্রতিক ফিড */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  <Activity
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400"
                  />
                  Recent Signals
                </span>
              </div>

              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-0.5">
                {visiblePins.map((pin) => {
                  const isSelected = pin.id === activePin.id;
                  const StatusIcon =
                    pin.status === "RESOLVED"
                      ? CheckCircle2
                      : pin.status === "IN_PROGRESS"
                        ? Wrench
                        : AlertTriangle;

                  return (
                    <button
                      className={`flex w-full items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-sky-400/50 bg-sky-500/10 dark:border-sky-400/40 dark:bg-sky-400/10"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5"
                      }`}
                      key={pin.id}
                      onClick={() => setActivePinId(pin.id)}
                      type="button"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StatusIcon
                          aria-hidden="true"
                          className={`h-3.5 w-3.5 shrink-0 ${
                            pin.status === "RESOLVED"
                              ? "text-emerald-400"
                              : pin.status === "IN_PROGRESS"
                                ? "text-sky-400"
                                : "text-amber-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white sm:text-sm">
                            {pin.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {pin.location}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 font-mono text-[10px] text-slate-400">
                        {pin.updatedAt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}