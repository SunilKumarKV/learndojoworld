"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterSchema } from "@/features/auth/schemas/register.schema";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { signUp, registerState } = useAuth();
  const registerLoading = Boolean("isPending" in registerState ? registerState.isPending : false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterSchema) => {
    setServerError(null);
    try {
      await signUp({
        name: values.name,
        username: values.username,
        email: values.email,
        password: values.password,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Unable to register.");
      }
    }
  };

  return (
    <AuthLayout
      title="Create your learner account"
      description="Sign up and start tracking your learning progress immediately."
      ctaLabel="Already have an account"
      ctaHref="/login"
    >
      <form className="space-y-6" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              type="text"
              autoComplete="name"
              className={cn(
                "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                errors.name ? "border-rose-500" : "",
              )}
              {...register("name")}
            />
          </label>
          {errors.name ? <p className="text-sm text-rose-600">{errors.name.message}</p> : null}

          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              type="text"
              autoComplete="username"
              className={cn(
                "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                errors.username ? "border-rose-500" : "",
              )}
              {...register("username")}
            />
          </label>
          {errors.username ? (
            <p className="text-sm text-rose-600">{errors.username.message}</p>
          ) : null}

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
            Password
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
            Confirm password
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
        </div>

        {serverError ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{serverError}</p>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button className="w-full sm:w-auto" type="submit" disabled={registerLoading}>
            {registerLoading ? "Creating account..." : "Create account"}
          </Button>
          <a href="/login" className="text-sm font-medium text-primary hover:text-primary/80">
            Sign in instead
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
