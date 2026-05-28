"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  verifyEmailSchema,
  type VerifyEmailSchema,
} from "@/features/auth/schemas/verify-email.schema";
import { cn } from "@/lib/utils";

export default function VerifyEmailPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: "", code: "" },
  });

  const onSubmit = async () => {
    setServerError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmitted(true);
    } catch {
      setServerError("Unable to verify your email. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      description="Confirm your account by entering the verification code from your inbox."
      ctaLabel="Back to login"
      ctaHref="/login"
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <label className="block text-sm font-medium text-slate-700">
          Email address
          <input
            type="email"
            autoComplete="email"
            className={cn(
              "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              errors.email ? "border-rose-500" : "",
            )}
            {...register("email")}
          />
        </label>
        {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}

        <label className="block text-sm font-medium text-slate-700">
          Verification code
          <input
            type="text"
            className={cn(
              "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              errors.code ? "border-rose-500" : "",
            )}
            {...register("code")}
          />
        </label>
        {errors.code ? <p className="text-sm text-rose-600">{errors.code.message}</p> : null}

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{serverError}</p>
        ) : null}
        {submitted ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            Your email is verified. You can now sign in to your learner dashboard.
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitted}>
          {submitted ? "Email verified" : "Verify email"}
        </Button>
      </form>
      <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Missing your code?</p>
        <p>Check your spam folder or request a new email from the support team.</p>
      </div>
    </AuthLayout>
  );
}
