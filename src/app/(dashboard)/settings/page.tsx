"use client";

import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../client/lib/api-client";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
  role: "CITIZEN" | "MANAGER" | "STAFF" | "ADMIN";
};

const ROLE_BADGE_STYLE: Record<Profile["role"], string> = {
  CITIZEN:
    "border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-300",
  STAFF:
    "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300",
  MANAGER:
    "border-indigo-400/30 bg-indigo-400/10 text-indigo-600 dark:text-indigo-300",
  ADMIN:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
};

export default function SettingsPage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void apiClient
      .get<Profile>("/api/users/me")
      .then((result) => {
        setProfile(result);
        setName(result.name);
        setPhone(result.phone || "");
      })
      .catch((error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load profile",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiClient.postForm<Profile>(
        "/api/users/me/avatar",
        formData,
      );
      setProfile(result);
      await update({ image: result.imageUrl });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload profile photo",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await apiClient.patch<Profile>("/api/users/me", {
        name: name.trim(),
        phone: phone.trim() || null,
      });
      setProfile(result);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.put<{ updated: boolean }>("/api/users/me", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update password",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const togglePasswordVisibility = (fieldId: string) => {
    setShowPasswords((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-10 sm:px-8">
        <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70" />
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      {/* ব্যাকগ্রাউন্ড অ্যাম্বিয়েন্ট গ্লো */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 right-10 -z-10 h-64 w-64 rounded-full bg-sky-400/10 blur-[110px]"
      />

      {/* পেজ হেডার */}
      <header className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1 dark:border-sky-400/30 dark:bg-sky-400/10">
          <Sparkles
            aria-hidden="true"
            className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
            Account Preferences
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Profile &{" "}
          <span className="font-serif italic font-semibold text-sky-600 dark:text-sky-400">
            Security Settings
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Manage your public citizen identity, contact details, and account credentials.
        </p>
      </header>

      {/* প্রোফাইল ওভারভিউ ও অ্যাভাটার আপলোড কার্ড */}
      <div className="mb-6 flex flex-col justify-between gap-5 rounded-3xl border border-slate-200/90 bg-gradient-to-r from-sky-500/[0.06] via-white to-amber-500/[0.05] p-6 shadow-sm dark:border-white/10 dark:from-sky-500/10 dark:via-slate-900/80 dark:to-amber-500/5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="group relative h-20 w-20 shrink-0">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400/40 bg-sky-100 text-sky-700 shadow-md dark:bg-slate-800 dark:text-sky-300">
              {profile?.imageUrl ? (
                <Image
                  alt={`${profile.name}'s profile photo`}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={profile.imageUrl}
                  unoptimized
                />
              ) : (
                <UserRound aria-hidden="true" className="h-9 w-9" />
              )}
            </div>

            <button
              aria-label="Upload new profile photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-slate-950 shadow-md transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-900 dark:bg-sky-400"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              type="button"
            >
              <Camera aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                {profile?.name}
              </h2>
              {profile?.role && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider ${
                    ROLE_BADGE_STYLE[profile.role]
                  }`}
                >
                  <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                  {profile.role}
                </span>
              )}
            </div>

            <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
              {profile?.email}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              JPG, PNG, or WebP · Maximum file size 5 MB
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={uploadAvatar}
            ref={avatarInputRef}
            type="file"
          />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 text-xs font-bold text-sky-700 transition hover:bg-sky-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-300 dark:hover:bg-sky-400 dark:hover:text-slate-950 sm:w-auto"
            disabled={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
            type="button"
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
            {uploadingAvatar ? "Uploading photo..." : "Change Photo"}
          </button>
        </div>
      </div>

      {/* ২-কলাম সেটিংস ফর্ম */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* বাম কার্ড: পার্সোনাল ইনফরমেশন */}
        <form
          className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md"
          onSubmit={updateProfile}
        >
          <div>
            <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400">
                <User aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your display name and contact phone
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="profile-name"
                >
                  Full name
                </label>
                <div className="relative mt-1.5">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-400"
                    id="profile-name"
                    minLength={2}
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="profile-email"
                  >
                    Email address
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-3.5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-400"
                    id="profile-email"
                    readOnly
                    value={profile?.email || ""}
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  htmlFor="profile-phone"
                >
                  Phone number
                </label>
                <div className="relative mt-1.5">
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-400"
                    id="profile-phone"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    value={phone}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-slate-200/80 pt-4 dark:border-white/10">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-slate-950 shadow-md shadow-sky-500/15 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:hover:bg-sky-300"
              disabled={savingProfile}
              type="submit"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {savingProfile ? "Saving changes..." : "Save Profile"}
            </button>
          </div>
        </form>

        {/* ডান কার্ড: পাসওয়ার্ড পরিবর্তন */}
        <form
          className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:backdrop-blur-md"
          onSubmit={updatePassword}
        >
          <div>
            <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-white/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                <KeyRound aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password & Security
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use a strong password of at least 8 characters
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  id: "current-password",
                  label: "Current password",
                  placeholder: "Enter your current password",
                  value: currentPassword,
                  setter: setCurrentPassword,
                },
                {
                  id: "new-password",
                  label: "New password",
                  placeholder: "Minimum 8 characters",
                  value: newPassword,
                  setter: setNewPassword,
                },
                {
                  id: "confirm-password",
                  label: "Confirm new password",
                  placeholder: "Re-enter new password",
                  value: confirmPassword,
                  setter: setConfirmPassword,
                },
              ].map((field) => {
                const isVisible = Boolean(showPasswords[field.id]);
                return (
                  <div key={field.id}>
                    <label
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                      htmlFor={field.id}
                    >
                      {field.label}
                    </label>
                    <div className="relative mt-1.5">
                      <Lock
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-white/15 dark:bg-slate-950/60 dark:text-white dark:focus:border-sky-400"
                        id={field.id}
                        minLength={field.id === "current-password" ? 1 : 8}
                        onChange={(event) => field.setter(event.target.value)}
                        placeholder={field.placeholder}
                        required
                        type={isVisible ? "text" : "password"}
                        value={field.value}
                      />
                      <button
                        aria-label={
                          isVisible ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                        onClick={() => togglePasswordVisibility(field.id)}
                        type="button"
                      >
                        {isVisible ? (
                          <EyeOff aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Eye aria-hidden="true" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-slate-200/80 pt-4 dark:border-white/10">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-slate-950 shadow-md shadow-sky-500/15 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:hover:bg-sky-300"
              disabled={savingPassword}
              type="submit"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              {savingPassword ? "Updating password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}