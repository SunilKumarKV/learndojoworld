"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { getMyBetaAccess } from "@/services/beta.api";

const checklist = [
  { key: "completeOnboarding", label: "Complete onboarding", href: "/onboarding" },
  { key: "enrollFirstCourse", label: "Enroll in first course", href: "/explore" },
  { key: "completeFirstLesson", label: "Complete first lesson", href: "/my-learning" },
  { key: "tryAITutor", label: "Try AI Tutor", href: "/ai" },
  { key: "submitFeedback", label: "Submit feedback", href: "/feedback" },
] as const;

export default function BetaWelcomePage() {
  const beta = useQuery({
    queryKey: ["beta", "me"],
    queryFn: getMyBetaAccess,
  });

  if (beta.isLoading) {
    return <LoadingState />;
  }

  if (beta.isError || !beta.data) {
    return <ErrorState message="Unable to load your beta status." />;
  }

  const completed = checklist.filter((item) => beta.data.activation[item.key]).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-4 w-4" />
            Beta welcome
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            First session checklist
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Beta status: {beta.data.status ?? "not invited yet"}. Complete these steps to help the
            team validate activation for the first 100 users.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            {completed}/{checklist.length} completed
          </p>
        </section>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
              <MessageSquare className="h-5 w-5 text-primary" />
              Activation steps
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => {
              const done = beta.data.activation[item.key];
              return (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                    <p className="font-semibold text-slate-900">{item.label}</p>
                  </div>
                  <Button asChild size="sm" variant={done ? "secondary" : "primary"}>
                    <a href={item.href}>{done ? "Review" : "Start"}</a>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
