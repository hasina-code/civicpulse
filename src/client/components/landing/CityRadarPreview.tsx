import { LocateFixed, Map, MapPinned } from "lucide-react";

export function CityRadarPreview() {
  return (
    <section
      aria-labelledby="city-radar-title"
      className="scroll-mt-20 bg-white py-20 dark:bg-signal-night sm:py-24"
      id="city-radar"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-signal-blue">
            A citywide perspective
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight text-signal-navy dark:text-signal-cream sm:text-4xl"
            id="city-radar-title"
          >
            See service work in its place.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
            A location-aware view helps city teams understand where reports
            originate and coordinate work across neighborhoods. The map below
            is an illustration, not live issue data.
          </p>
          <div className="mt-7 flex items-start gap-3">
            <MapPinned
              aria-hidden="true"
              className="mt-1 h-5 w-5 shrink-0 text-signal-blue"
            />
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Reports can include a location so the right team can review the
              area and plan a response.
            </p>
          </div>
        </div>
        <div
          aria-label="Illustrative map grid showing streets and a location marker"
          className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-signal-cream dark:border-slate-800 dark:bg-signal-navy"
          role="img"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60 [background-image:linear-gradient(32deg,transparent_47%,#cbd5e1_48%,#cbd5e1_50%,transparent_51%),linear-gradient(145deg,transparent_46%,#cbd5e1_47%,#cbd5e1_49%,transparent_50%),linear-gradient(90deg,transparent_48%,#e2e8f0_49%,#e2e8f0_51%,transparent_52%)] [background-size:120px_100px,150px_130px,80px_100%] dark:opacity-20"
          />
          <div
            aria-hidden="true"
            className="absolute h-52 w-52 rounded-full border border-signal-blue/20"
          />
          <div
            aria-hidden="true"
            className="absolute h-36 w-36 rounded-full border border-signal-blue/30"
          />
          <div className="relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white/95 px-7 py-6 text-center shadow-lg dark:border-slate-800 dark:bg-signal-navy">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal-blue text-white">
              <LocateFixed aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-signal-navy dark:text-signal-cream">
              Location-aware city services
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              An illustrative map view
            </p>
          </div>
          <Map
            aria-hidden="true"
            className="absolute bottom-5 right-5 h-5 w-5 text-signal-navy/40 dark:text-white/40"
          />
        </div>
      </div>
    </section>
  );
}
