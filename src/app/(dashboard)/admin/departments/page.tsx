"use client";

import { AlertCircle, Building2, Loader2, Plus, RefreshCw, Save, Users } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";

type Manager = { id: string; name: string; email: string; departmentId: string | null };
type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
  _count: { members: number; issues: number };
};
type DepartmentDraft = { name: string; description: string; managerId: string; isActive: boolean };
type UserResult = { items: Manager[] };

const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DepartmentDraft>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [departmentList, managerList] = await Promise.all([
        apiClient.get<Department[]>("/api/departments", { signal }),
        apiClient.get<UserResult>("/api/users?role=MANAGER&limit=50", { signal }),
      ]);
      if (signal.aborted) return;
      setDepartments(departmentList);
      setManagers(managerList.items);
      setDrafts(Object.fromEntries(departmentList.map((department) => [department.id, {
        name: department.name,
        description: department.description ?? "",
        managerId: department.managerId ?? "",
        isActive: department.isActive,
      }])));
    } catch (caught) {
      if (!signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load departments");
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

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.post("/api/departments", { name, description: description.trim() || undefined });
      toast.success("Department created");
      setName("");
      setDescription("");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to create department");
    } finally {
      setSaving(false);
    }
  }

  async function saveDepartment(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/departments/${id}`, {
        name: draft.name,
        description: draft.description.trim() || null,
        managerId: draft.managerId || null,
        isActive: draft.isActive,
      });
      toast.success("Department updated");
      setReloadKey((key) => key + 1);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to update department");
    } finally {
      setSaving(false);
    }
  }

  function updateDraft(id: string, patch: Partial<DepartmentDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  const activeCount = departments.filter((department) => department.isActive).length;
  const memberCount = departments.reduce((total, department) => total + department._count.members, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Organization</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">Department management</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create service departments, assign managers, and manage department status.</p></div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:border-sky-400 hover:text-sky-600 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200" disabled={loading} onClick={() => setReloadKey((key) => key + 1)} type="button"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Departments" value={departments.length} icon={Building2} />
        <Stat label="Active departments" value={activeCount} icon={Building2} />
        <Stat label="Department members" value={memberCount} icon={Users} />
      </section>

      <form className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70" onSubmit={(event) => void createDepartment(event)}>
        <div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400"><Plus className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">Add a department</h2><p className="text-xs text-slate-500 dark:text-slate-400">Start with a unique name and optional description.</p></div></div>
        <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <input className={inputClass} maxLength={120} minLength={2} onChange={(event) => setName(event.target.value)} placeholder="Department name" required value={name} />
          <input className={inputClass} maxLength={1000} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" value={description} />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white transition hover:bg-sky-600 disabled:opacity-50" disabled={saving} type="submit">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create department</button>
        </div>
      </form>

      {error ? <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" role="alert"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span><button className="text-xs font-bold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Retry</button></div> : null}
      {loading && departments.length === 0 ? <div className="mt-5 grid animate-pulse gap-4 lg:grid-cols-2">{[1, 2, 3, 4].map((item) => <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" key={item} />)}</div> : departments.length ? <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {departments.map((department) => {
          const draft = drafts[department.id];
          if (!draft) return null;
          const availableManagers = managers.filter((manager) => !manager.departmentId || manager.departmentId === department.id);
          return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70" key={department.id}>
            <div className="mb-4 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Building2 className="h-5 w-5" /></span><div><h2 className="text-sm font-black text-slate-900 dark:text-white">{department.name}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{department._count.members} members · {department._count.issues} reports</p></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${department.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{department.isActive ? "Active" : "Inactive"}</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Department name<input className={`${inputClass} mt-1.5`} maxLength={120} minLength={2} onChange={(event) => updateDraft(department.id, { name: event.target.value })} value={draft.name} /></label>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Department manager<select className={`${inputClass} mt-1.5`} onChange={(event) => updateDraft(department.id, { managerId: event.target.value })} value={draft.managerId}><option value="">No manager assigned</option>{availableManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} · {manager.email}</option>)}</select></label>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:col-span-2">Description<textarea className={`${inputClass} mt-1.5 h-20 resize-y py-2`} maxLength={1000} onChange={(event) => updateDraft(department.id, { description: event.target.value })} value={draft.description} /></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><input checked={draft.isActive} className="h-4 w-4 accent-sky-500" onChange={(event) => updateDraft(department.id, { isActive: event.target.checked })} type="checkbox" />Department active</label>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-500 px-3 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-50" disabled={saving} onClick={() => void saveDepartment(department.id)} type="button"><Save className="h-3.5 w-3.5" />Save changes</button>
            </div>
          </article>;
        })}
      </section> : !loading ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-white/10"><Building2 className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No departments yet</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Create the first department above.</p></div> : null}
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Building2 }) {
  return <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Icon className="h-4 w-4" /></span><span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span><span className="mt-1 block font-mono text-xl font-black text-slate-900 dark:text-white">{value}</span></span></article>;
}
