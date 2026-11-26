import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "../../../client/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a CivicPulse account and select your desired dashboard.",
};

export default function RegisterPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#F7F5EE] px-4 py-10">
      <div className="w-full max-w-[448px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            aria-label="CivicPulse home"
            className="flex items-center gap-2"
            href="/"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="h-10 w-10 object-contain"
              height={40}
              priority
              src="/images/Logo.png"
              width={40}
            />
            <span className="text-lg font-black tracking-tight text-[#111C33]">
              Civic<span className="text-[#0BA0CB]">Pulse</span>
            </span>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#2563EB] transition hover:bg-blue-50"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1E293B]">
            Register New Account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Join the smart city municipal platform and access your desired role
            dashboard.
          </p>
        </header>
        <RegisterForm />
      </div>
    </section>
  );
}
