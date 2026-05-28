"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginSchema } from "@/features/auth/schemas/login.schema";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { signIn, loginState } = useAuth();
  const loginLoading = Boolean("isPending" in loginState ? loginState.isPending : false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setServerError(null);
    try {
      await signIn(values);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Unable to sign in.");
      }
    }
  };

  return (
    <AuthLayout
      title="Sign in to your learner account"
      description="Access your dashboard and training progress with a secure sign-in flow."
      ctaLabel="Create account"
      ctaHref="/register"
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email or username
            <input
              type="text"
              autoComplete="username"
              className={cn(
                "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                errors.identifier ? "border-rose-500" : "",
              )}
              {...register("identifier")}
            />
          </label>
          {errors.identifier ? (
            <p className="text-sm text-rose-600">{errors.identifier.message}</p>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
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
        </div>

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{serverError}</p>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button className="w-full sm:w-auto" type="submit" disabled={loginLoading}>
            {loginLoading ? "Signing in..." : "Sign in"}
          </Button>
          <a
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Forgot password?
          </a>
        </div>
      </form>
      <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-900">Need help?</p>
        <p>
          Use your registered email or username to sign in. If your account is still pending
          verification, check your inbox.
        </p>
      </div>
    </AuthLayout>
  );
}
