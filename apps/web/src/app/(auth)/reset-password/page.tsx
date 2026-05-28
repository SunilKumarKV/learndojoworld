"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/features/auth/schemas/reset-password.schema";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async () => {
    setServerError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmitted(true);
    } catch {
      setServerError("Unable to reset your password. Please try again.");
    }
  };

  useEffect(() => {
    if (submitted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [submitted]);

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the verification code and choose a new password to restore access."
      ctaLabel="Back to login"
      ctaHref="/login"
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
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

        <label className="block text-sm font-medium text-slate-700">
          New password
          <input
            type="password"
            autoComplete="new-password"
            className={cn(
              "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              errors.password ? "border-rose-500" : "",
            )}
            {...register("password")}
          />
        </label>
        {errors.password ? (
          <p className="text-sm text-rose-600">{errors.password.message}</p>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            className={cn(
              "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
              errors.confirmPassword ? "border-rose-500" : "",
            )}
            {...register("confirmPassword")}
          />
        </label>
        {errors.confirmPassword ? (
          <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p>
        ) : null}

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{serverError}</p>
        ) : null}
        {submitted ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            Your password has been reset. You can now sign in with the new credentials.
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitted}>
          {submitted ? "Password reset" : "Confirm new password"}
        </Button>
      </form>
      <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Still locked out?</p>
        <p>Return to the login page or request a new code from the forgot password page.</p>
        <a
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Request a new link
        </a>
      </div>
    </AuthLayout>
  );
}
