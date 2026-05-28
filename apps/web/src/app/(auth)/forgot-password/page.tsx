"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/features/auth/schemas/forgot-password.schema";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async () => {
    setServerError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSubmitted(true);
    } catch {
      setServerError("Unable to submit request. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter the email associated with your account and we'll send reset instructions."
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

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{serverError}</p>
        ) : null}
        {submitted ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
            If that email exists in our system, you will receive a reset link shortly.
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitted}>
          {submitted ? "Request sent" : "Send reset email"}
        </Button>
      </form>
      <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Need another option?</p>
        <p>Reach out to support if you do not receive an email within a few minutes.</p>
      </div>
    </AuthLayout>
  );
}
