"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getProviders, getSession, signIn } from "next-auth/react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from "../../../shared/constants/routes";
import type { UserRole } from "../../../shared/constants/roles";
import { loginSchema } from "../../../shared/validators/auth.schema";
import type { z } from "zod";

type LoginInput = z.infer<typeof loginSchema>;

const demoAccounts: Array<{
  role: UserRole;
  label: string;
  email: string;
  password: string;
}> = [
  { role: "CITIZEN", label: "Citizen Portal", email: "citizen.hasina@civicpulse.gov", password: "citizen123" },
  { role: "MANAGER", label: "Dept Manager", email: "manager.roads@civicpulse.gov", password: "manager123" },
  { role: "STAFF", label: "Field Crew", email: "staff.electric@civicpulse.gov", password: "staff123" },
  { role: "ADMIN", label: "City Admin", email: "admin@civicpulse.gov", password: "admin123" },
];

const inputClassName =
  "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
      <path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#4CAF50" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
      <path fill="#1976D2" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const completeLogin = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error("Invalid email or password");
    }

    const session = await getSession();
    const role = session?.user.role;
    if (!role) {
      throw new Error("Unable to determine your portal");
    }

    toast.success("Login successful");
    router.push(DASHBOARD_ROUTES[role]);
    router.refresh();
  };

  const onSubmit = async (values: LoginInput) => {
    setErrorMessage(null);

    try {
      await completeLogin(values.email, values.password);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log in";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const onDemoLogin = async (account: (typeof demoAccounts)[number]) => {
    setErrorMessage(null);
    setLoadingRole(account.role);

    try {
      await completeLogin(account.email, account.password);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to log in";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoadingRole(null);
    }
  };

  const onGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      const providers = await getProviders();
      if (!providers?.google) {
        throw new Error("Google sign-in is not configured for this application.");
      }

      await signIn("google", { callbackUrl: PUBLIC_ROUTES.HOME });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in";
      setErrorMessage(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  const demoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE?.toLowerCase() === "true";

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <form
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email Address
          </label>
          <input
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={inputClassName}
            id="email"
            inputMode="email"
            placeholder="e.g. tayabunnesa@gmail.com"
            type="email"
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              className={`${inputClassName} pr-11`}
              id="password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
            />
            {/* mt-2 matches the input's top margin so the icon stays centered */}
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 mt-2 flex h-11 w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-xs leading-5 text-slate-500">
          <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>
            Your credentials determine your municipal access level. Citizens access
            the Citizen Portal; City Administrators require verified administrative
            credentials.
          </p>
        </div>

        <button
          className="h-11 w-full rounded-lg bg-[#315BFF] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || loadingRole !== null || googleLoading}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign In & Receive Email Code"}
        </button>

        <div className="flex items-center gap-2 pt-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">OR CONTINUE WITH</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={googleLoading || isSubmitting || loadingRole !== null}
          onClick={() => void onGoogleLogin()}
          type="button"
        >
          <GoogleMark />
          {googleLoading ? "Connecting to Google..." : "Sign in with Google"}
        </button>

        <p className="pt-1 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-blue-700 hover:underline" href={PUBLIC_ROUTES.REGISTER}>
            Create an account →
          </Link>
        </p>

        {demoMode ? (
          <section className="rounded-2xl border-2 border-[#FACC15] bg-white px-4 py-4">
            <h2 className="text-center text-xs font-bold tracking-wide text-[#315BFF]">
              AUTHORIZED ROLE PERSONAS (QUICK DEMO)
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 transition hover:border-[#2563EB] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting || loadingRole !== null || googleLoading}
                  key={account.role}
                  onClick={() => void onDemoLogin(account)}
                  type="button"
                >
                  {loadingRole === account.role
                    ? "Signing in..."
                    : account.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </form>
    </div>
  );
}
