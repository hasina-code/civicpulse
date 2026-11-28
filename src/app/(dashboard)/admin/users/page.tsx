"use client";

import { AlertCircle, Loader2, Pencil, Plus, Search, Users, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../client/lib/api-client";
import { USER_ROLES, USER_ROLE_LABELS, type UserRole } from "../../../../shared/constants/roles";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  departmentId: string | null;
  createdAt: string;
};
type Department = { id: string; name: string; isActive: boolean };
type UserResult = { items: User[]; page: number; total: number; totalPages: number };
type UserForm = { name: string; email: string; password: string; phone: string; role: UserRole; departmentId: string; isActive: boolean };

const PAGE_SIZE = 12;
const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100";

const emptyForm: UserForm = { name: "", email: "", password: "", phone: "", role: "CITIZEN", departmentId: "", isActive: true };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    if (role) params.set("role", role);
    if (activeFilter) params.set("isActive", activeFilter);
    try {
      const [result, departmentList] = await Promise.all([
        apiClient.get<UserResult>(`/api/users?${params}`, { signal }),
        apiClient.get<Department[]>("/api/departments", { signal }),
      ]);
      if (signal.aborted) return;
      setUsers(result.items);
      setTotal(result.total);
      setTotalPages(Math.max(1, result.totalPages));
      setDepartments(departmentList);
    } catch (caught) {
      if (!signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load users");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [activeFilter, page, query, role]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void load(controller.signal), 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [load, reloadKey]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", phone: user.phone ?? "", role: user.role, departmentId: user.departmentId ?? "", isActive: user.isActive });
    setFormOpen(true);
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiresDepartment = form.role === "MANAGER" || form.role === "STAFF";
    if (requiresDepartment && !form.departmentId) {
      toast.error("Select a department for managers and staff");
      return;
    }
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      role: form.role,
      departmentId: requiresDepartment ? form.departmentId : null,
      isActive: form.isActive,
      ...(!editing ? { password: form.password } : {}),
    };
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/api/users/${editing.id}`, body);
        toast.success("User updated");
      } else {
        await apiClient.post("/api/users", body);
        toast.success("User created");
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to save user");
    } finally {
      setSaving(false);
    }
  }

  const requiresDepartment = form.role === "MANAGER" || form.role === "STAFF";

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Access control</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">User management</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage CivicPulse accounts, roles, department assignments, and access status.</p></div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white hover:bg-sky-600" onClick={openCreate} type="button"><Plus className="h-4 w-4" />Add user</button>
      </header>

      <section className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Users className="h-4 w-4" /></span><div><p className="font-mono text-xl font-black text-slate-900 dark:text-white">{total.toLocaleString()}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Accounts matching filters</p></div></section>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-10 pr-10`} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone..." value={search} />{search ? <button aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setSearch("")} type="button"><X className="h-4 w-4" /></button> : null}</div>
        <select aria-label="Filter by role" className={inputClass} onChange={(event) => { setRole(event.target.value as UserRole | ""); setPage(1); }} value={role}><option value="">All roles</option>{Object.values(USER_ROLES).map((value) => <option key={value} value={value}>{USER_ROLE_LABELS[value]}</option>)}</select>
        <select aria-label="Filter by account status" className={inputClass} onChange={(event) => { setActiveFilter(event.target.value as "" | "true" | "false"); setPage(1); }} value={activeFilter}><option value="">All accounts</option><option value="true">Active only</option><option value="false">Inactive only</option></select>
      </div>

      {error ? <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300" role="alert"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span><button className="text-xs font-bold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Retry</button></div> : null}
      <div className={`mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 ${loading ? "opacity-60" : ""}`}>
        {loading && users.length === 0 ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" key={item} />)}</div> : users.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/10">{users.map((user) => {
          const department = departments.find((item) => item.id === user.departmentId);
          return <tr className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]" key={user.id}><td className="px-5 py-4"><p className="font-bold text-slate-900 dark:text-white">{user.name}</p><p className="mt-1 text-slate-500 dark:text-slate-400">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p></td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{USER_ROLE_LABELS[user.role]}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{department?.name ?? "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{user.isActive ? "Active" : "Inactive"}</span></td><td className="px-5 py-4 text-right"><button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-600 hover:border-sky-400 hover:text-sky-600 dark:border-white/10 dark:text-slate-300" onClick={() => openEdit(user)} type="button"><Pencil className="h-3 w-3" />Edit</button></td></tr>;
        })}</tbody></table></div> : <div className="px-6 py-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No matching users</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try changing the search or filters.</p></div>}
      </div>

      {!error && totalPages > 1 ? <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>Page {page} of {totalPages} · {total} users</span><div className="flex gap-2"><button className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40 dark:border-white/10" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">Previous</button><button className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40 dark:border-white/10" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">Next</button></div></div> : null}

      {formOpen ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setFormOpen(false)}><form className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void saveUser(event)}>
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-lg font-black text-slate-900 dark:text-white">{editing ? "Edit user" : "Create user"}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{editing ? "Update profile, permissions and account status." : "Create an account and choose its access role."}</p></div><button aria-label="Close dialog" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setFormOpen(false)} type="button"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Full name<input autoComplete="name" className={`${inputClass} mt-1.5`} maxLength={100} minLength={2} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required value={form.name} /></label>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Email<input autoComplete="email" className={`${inputClass} mt-1.5`} maxLength={254} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} required type="email" value={form.email} /></label>
          {!editing ? <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Temporary password<input autoComplete="new-password" className={`${inputClass} mt-1.5`} minLength={8} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} required type="password" value={form.password} /></label> : null}
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Phone (optional)<input className={`${inputClass} mt-1.5`} maxLength={30} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} value={form.phone} /></label>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Access role<select className={`${inputClass} mt-1.5`} onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as UserRole, departmentId: "" }))} value={form.role}>{Object.values(USER_ROLES).map((value) => <option key={value} value={value}>{USER_ROLE_LABELS[value]}</option>)}</select></label>
          {requiresDepartment ? <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Department<select className={`${inputClass} mt-1.5`} onChange={(event) => setForm((value) => ({ ...value, departmentId: event.target.value }))} required value={form.departmentId}><option value="">Select department</option>{departments.filter((department) => department.isActive).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label> : null}
          <label className="inline-flex items-center gap-2 self-end pb-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><input checked={form.isActive} className="h-4 w-4 accent-sky-500" onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} type="checkbox" />Account active</label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10"><button className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300" onClick={() => setFormOpen(false)} type="button">Cancel</button><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-extrabold text-white hover:bg-sky-600 disabled:opacity-50" disabled={saving} type="submit">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editing ? "Save changes" : "Create account"}</button></div>
      </form></div> : null}
    </div>
  );
}
