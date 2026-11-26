"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getProviders, getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { apiClient } from "../../lib/api-client";
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from "../../../shared/constants/routes";
import { registerSchema } from "../../../shared/validators/auth.schema";
import type { z } from "zod";

type RegisterFormInput = z.input<typeof registerSchema>;
type RegisterInput = z.output<typeof registerSchema>;
type DepartmentOption = { id: string; name: string };

const inputClassName =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

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

export function RegisterForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "CITIZEN",
      departmentId: "",
    },
  });
  const selectedRole = useWatch({ control, name: "role" }) ?? "CITIZEN";
  const departmentRequired = selectedRole === "MANAGER" || selectedRole === "STAFF";
  const departmentRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => departmentRequest.current?.abort();
  }, []);

  const roleRegistration = register("role");
  const onRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void roleRegistration.onChange(event);
    setValue("departmentId", "");
    departmentRequest.current?.abort();

    const role = event.currentTarget.value;
    if (role !== "MANAGER" && role !== "STAFF") {
      setDepartments([]);
      setDepartmentError(null);
      setDepartmentsLoading(false);
      return;
    }

    const request = new AbortController();
    departmentRequest.current = request;
    setDepartmentsLoading(true);
    setDepartmentError(null);

    void apiClient
      .get<DepartmentOption[]>("/api/departments", { signal: request.signal })
      .then(setDepartments)
      .catch((error: unknown) => {
        if (!request.signal.aborted) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load departments";
          setDepartmentError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!request.signal.aborted) {
          setDepartmentsLoading(false);
        }
      });
  };

  const onSubmit = async (values: RegisterInput) => {
    setErrorMessage(null);

    try {
      await apiClient.post("/api/auth/register", {
        ...values,
        phone: values.phone?.trim() || undefined,
        departmentId: values.departmentId || undefined,
      });

      const loginResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!loginResult || loginResult.error) {
        toast.error("Account created, but automatic sign-in failed. Please log in.");
        router.push(PUBLIC_ROUTES.LOGIN);
        router.refresh();
        return;
      }

      const session = await getSession();
      const role = session?.user.role ?? values.role;
      toast.success("Account created successfully");
      router.push(DASHBOARD_ROUTES[role]);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your account";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const onGoogleRegister = async () => {
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

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
      onSubmit={handleSubmit(onSubmit)}
    >
      {errorMessage ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="register-name">
          Full Name *
        </label>
        <input
          {...register("name")}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className={inputClassName}
          id="register-name"
          placeholder="e.g. Jane Citizen"
          type="text"
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="register-email">
          Email Address *
        </label>
        <input
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={inputClassName}
          id="register-email"
          inputMode="email"
          placeholder="e.g. citizen.hasina@civicpulse.gov"
          type="email"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="register-phone">
          Phone Number
        </label>
        <input
          {...register("phone")}
          autoComplete="tel"
          className={inputClassName}
          id="register-phone"
          inputMode="tel"
          placeholder="+880 1700-000000"
          type="tel"
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="register-password">
          Password *
        </label>
        <input
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          className={inputClassName}
          id="register-password"
          placeholder="Minimum 8 characters"
          type="password"
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="register-role">
          Account Role &amp; Desired Dashboard *
        </label>
        <select
          {...roleRegistration}
          aria-invalid={Boolean(errors.role)}
          className={inputClassName}
          id="register-role"
          onChange={onRoleChange}
        >
          <option value="CITIZEN">Citizen — Citizen Portal (/citizen)</option>
          <option value="MANAGER">Department Manager — Manager Hub (/manager)</option>
          <option value="STAFF">Maintenance Staff — Field Crew Portal (/staff)</option>
          <option value="ADMIN">City Admin — Admin Console (/admin)</option>
        </select>
        {errors.role ? (
          <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
        ) : null}
      </div>

      {departmentRequired ? (
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="register-department">
            Department
          </label>
          <select
            {...register("departmentId")}
            className={inputClassName}
            disabled={departmentsLoading || departments.length === 0}
            id="register-department"
          >
            <option value="">
              {departmentsLoading ? "Loading departments..." : "Select a department"}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          {departmentError ? (
            <p className="mt-1 text-xs text-red-600">{departmentError}</p>
          ) : null}
        </div>
      ) : null}

      {selectedRole !== "CITIZEN" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          {selectedRole === "ADMIN"
            ? "Admin accounts must be provisioned by an existing administrator."
            : "Manager and staff accounts require an invitation from an administrator."}
        </p>
      ) : null}

      <button
        className="h-11 w-full rounded-lg bg-[#2563EB] text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || googleLoading}
        type="submit"
      >
        {isSubmitting
          ? "Creating account..."
          : "Register & Enter Selected Dashboard"}
      </button>

      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">OR REGISTER WITH</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={googleLoading || isSubmitting}
        onClick={() => void onGoogleRegister()}
        type="button"
      >
        <GoogleMark />
        {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
      </button>

      <p className="pt-1 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link className="font-medium text-blue-700 hover:underline" href={PUBLIC_ROUTES.LOGIN}>
          Log In here →
        </Link>
      </p>
    </form>
  );
}
