"use client";

import { ArrowRight, BadgeCheck, BookOpen, IndianRupee, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreatorProfileForm } from "@/features/creator/components/creator-profile-form";
import { useCreatorApply } from "@/features/creator/hooks/use-creator";
import { useSession } from "@/hooks/use-session";
import type { CreatorProfilePayload } from "@/services/creator.api";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const { isLoading, user } = useSession();
  const applyMutation = useCreatorApply();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "CREATOR") router.replace("/creator/dashboard");
  }, [isLoading, router, user]);

  async function handleSubmit(payload: CreatorProfilePayload) {
    if (!user) {
      router.push("/login?next=/become-creator");
      return;
    }

    setErrorMessage("");
    try {
      await applyMutation.mutateAsync(payload);
      router.replace("/creator/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create creator profile.");
    }
  }

  if (isLoading || user?.role === "CREATOR") {
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-sm text-slate-600">
        Loading creator studio...
      </main>
    );
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
              Teach what you know. Build courses. Earn from verified learning.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              LearnDojoWorld creators can build course drafts, submit them for review, sell paid
              courses after publishing, track verified revenue, and request payout review without
              losing learner abilities.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Button asChild>
                  <a href="#creator-form">
                    <Sparkles aria-hidden className="h-4 w-4" />
                    Start profile
                  </a>
                </Button>
              ) : (
                <Button asChild>
                  <a href="/register">
                    <Sparkles aria-hidden className="h-4 w-4" />
                    Create account
                  </a>
                </Button>
              )}
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
              title="Course builder"
              text="Create course drafts, modules, and text lessons, then submit for review."
            />
            <CreatorPromise
              icon={<IndianRupee className="h-5 w-5" />}
              title="Verified revenue"
              text="Paid course earnings are recorded only after verified payment webhooks."
            />
            <CreatorPromise
              icon={<Wallet className="h-5 w-5" />}
              title="Payout requests"
              text="Save payout profile details and request admin review of unpaid earnings."
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
            {user ? (
              <>
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
              </>
            ) : (
              <div className="space-y-4">
                <p className="rounded-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                  Sign in or create an account to apply. Creator access upgrades your existing
                  learner account and keeps learner progress intact.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a href="/login?next=/become-creator">Sign in to apply</a>
                  </Button>
                  <Button asChild variant="secondary">
                    <a href="/register">Create account</a>
                  </Button>
                </div>
              </div>
            )}
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
