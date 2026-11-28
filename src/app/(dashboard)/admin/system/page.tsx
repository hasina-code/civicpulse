"use client";

import { AlertCircle, Clock3, Loader2, RefreshCw, Save, ShieldCheck, Timer } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";

type DispatchPolicy = "CATEGORY" | "NEAREST" | "WORKLOAD";
type SystemConfig = {
  slaHoursLow: number;
  slaHoursMedium: number;
  slaHoursHigh: number;
  slaHoursCritical: number;
  duplicateRadiusMeters: number;
  dispatchPolicy: DispatchPolicy;
  reminderIntervalMinutes: number;
  updatedAt: string;
};

const numericSettings: { key: keyof Pick<SystemConfig, "slaHoursLow" | "slaHoursMedium" | "slaHoursHigh" | "slaHoursCritical" | "duplicateRadiusMeters" | "reminderIntervalMinutes">; label: string; description: string; min: number; max: number; unit: string }[] = [
  { key: "slaHoursLow", label: "Low priority response", description: "Resolution target for low priority reports.", min: 1, max: 87600, unit: "hours" },
  { key: "slaHoursMedium", label: "Medium priority response", description: "Resolution target for medium priority reports.", min: 1, max: 87600, unit: "hours" },
  { key: "slaHoursHigh", label: "High priority response", description: "Resolution target for high priority reports.", min: 1, max: 87600, unit: "hours" },
  { key: "slaHoursCritical", label: "Critical priority response", description: "Resolution target for critical priority reports.", min: 1, max: 87600, unit: "hours" },
  { key: "duplicateRadiusMeters", label: "Duplicate detection radius", description: "Nearby same-category reports are flagged as possible duplicates.", min: 1, max: 10000, unit: "meters" },
  { key: "reminderIntervalMinutes", label: "Reminder interval", description: "How often pending-work reminders may be sent.", min: 1, max: 10080, unit: "minutes" },
];

const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100";

export default function AdminSystemPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<SystemConfig>("/api/settings", { signal });
      if (!signal.aborted) setConfig(result);
    } catch (caught) {
      if (!signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load system settings");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load, reloadKey]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const saved = await apiClient.patch<SystemConfig>("/api/settings", {
        slaHoursLow: config.slaHoursLow,
        slaHoursMedium: config.slaHoursMedium,
        slaHoursHigh: config.slaHoursHigh,
        slaHoursCritical: config.slaHoursCritical,
        duplicateRadiusMeters: config.duplicateRadiusMeters,
        dispatchPolicy: config.dispatchPolicy,
        reminderIntervalMinutes: config.reminderIntervalMinutes,
      });
      setConfig(saved);
      toast.success("System settings saved");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to save system settings");
    } finally {
      setSaving(false);
    }
  }

  function updateNumber(key: (typeof numericSettings)[number]["key"], value: number) {
    setConfig((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Platform governance</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">System settings</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure service-level targets, dispatch behavior, and automated reminders.</p></div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" disabled={loading} onClick={() => setReloadKey((key) => key + 1)} type="button"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Reload</button>
      </header>

      {error ? <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" role="alert"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span><button className="text-xs font-bold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Retry</button></div> : null}
      {loading && !config ? <div className="mt-6 h-[500px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /> : null}

      {config ? <form className="mt-6 space-y-6" onSubmit={(event) => void save(event)}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Clock3 className="h-5 w-5" /></span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Service-level targets</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Resolution deadlines used for SLA reporting and operational follow-up.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{numericSettings.slice(0, 4).map((setting) => <label className="rounded-xl border border-slate-100 p-4 dark:border-white/10" key={setting.key}><span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{setting.label}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">{setting.description}</span><span className="mt-3 flex items-center gap-2"><input className={inputClass} max={setting.max} min={setting.min} onChange={(event) => updateNumber(setting.key, Number(event.target.value))} required type="number" value={config[setting.key]} /><span className="w-14 shrink-0 text-[11px] text-slate-500">{setting.unit}</span></span></label>)}</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Dispatch policy</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose how new approved issues are routed to field teams.</p></div></div>
          <label className="block max-w-xl text-xs font-bold text-slate-600 dark:text-slate-300">Assignment strategy<select className={`${inputClass} mt-2`} onChange={(event) => setConfig((current) => current ? { ...current, dispatchPolicy: event.target.value as DispatchPolicy } : current)} value={config.dispatchPolicy}><option value="CATEGORY">By issue category</option><option value="NEAREST">Nearest available team</option><option value="WORKLOAD">Balance by team workload</option></select></label>
          <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">This policy is stored for dispatch workflows; category-based assignment remains the default routing behavior.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Timer className="h-5 w-5" /></span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Automation &amp; duplicate detection</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tune the geographic matching radius and reminder cadence.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{numericSettings.slice(4).map((setting) => <label className="rounded-xl border border-slate-100 p-4 dark:border-white/10" key={setting.key}><span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{setting.label}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">{setting.description}</span><span className="mt-3 flex items-center gap-2"><input className={inputClass} max={setting.max} min={setting.min} onChange={(event) => updateNumber(setting.key, Number(event.target.value))} required type="number" value={config[setting.key]} /><span className="w-14 shrink-0 text-[11px] text-slate-500">{setting.unit}</span></span></label>)}</div>
        </section>

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><p className="text-[11px] text-slate-500 dark:text-slate-400">Last updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(config.updatedAt))}</p><button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-xs font-extrabold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={saving || loading} type="submit">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save system settings</button></div>
      </form> : null}
    </div>
  );
}
