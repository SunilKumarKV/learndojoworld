"use client";

import { ArrowRight, BadgeCheck, BookOpen, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreatorProfileForm } from "@/features/creator/components/creator-profile-form";
import { useCreatorApply } from "@/features/creator/hooks/use-creator";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useSession } from "@/hooks/use-session";
import type { CreatorProfilePayload } from "@/services/creator.api";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const { isLoading, user } = useSession();
  const applyMutation = useCreatorApply();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login?next=/become-creator");
    if (user?.role === "CREATOR") router.replace("/creator/dashboard");
  }, [isLoading, router, user]);

  async function handleSubmit(payload: CreatorProfilePayload) {
    setErrorMessage("");
    try {
      await applyMutation.mutateAsync(payload);
      router.replace("/creator/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create creator profile.");
    }
  }

  if (isLoading || !user || user.role === "CREATOR") {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Creator Studio
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Teach what you know. Keep your learner account.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Start with a creator profile foundation today. Course creation, payments, and
              marketplace tools arrive later without blocking your current learning flow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="#creator-form">
                  <Sparkles aria-hidden className="h-4 w-4" />
                  Start profile
                </a>
              </Button>
              <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                Learner dashboard
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CreatorPromise
              icon={<BadgeCheck className="h-5 w-5" />}
              title="Role upgrade"
              text="Your account becomes CREATOR while learner progress stays intact."
            />
            <CreatorPromise
              icon={<BookOpen className="h-5 w-5" />}
              title="Course foundation"
              text="Your studio can list creator-owned courses when builder support lands."
            />
          </div>
        </section>

        <Card id="creator-form">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Application
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Build your public creator profile
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This is the foundation learners will see later. No monetization or publishing is
                enabled yet.
              </p>
            </div>
            {errorMessage ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            ) : null}
            <CreatorProfileForm
              isSubmitting={applyMutation.isPending}
              mode="apply"
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function CreatorPromise({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft-xl">
      <div className="mb-4 inline-flex rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
