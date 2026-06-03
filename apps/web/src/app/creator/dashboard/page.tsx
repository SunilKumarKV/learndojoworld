"use client";

import { BookOpen, IndianRupee, Plus, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CreatorStatCard } from "@/features/creator/components/creator-stat-card";
import { useCreatorDashboard } from "@/features/creator/hooks/use-creator";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";

export default function CreatorDashboardPage() {
  const router = useRouter();
  const { data, error, isError, isLoading } = useCreatorDashboard();

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "We could not load creator dashboard."}
      />
    );
  }

  const metrics = data?.metrics ?? {
    coursesCount: 0,
    learnersCount: 0,
    rating: null,
    revenue: { amount: 0, currency: "INR" as const },
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Creator dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Your studio is ready.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Creator tools are intentionally lean right now: profile, owned course list, and
              marketplace foundation without fake monetization.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/creator/courses/new">
              <Plus aria-hidden className="h-4 w-4" />
              Create course
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CreatorStatCard
          detail="Payments are not enabled, so revenue stays at zero."
          icon={<IndianRupee className="h-5 w-5" />}
          label="Revenue"
          value={`₹${metrics.revenue.amount}`}
        />
        <CreatorStatCard
          detail="Courses connected to your creator account."
          icon={<BookOpen className="h-5 w-5" />}
          label="Courses"
          value={String(metrics.coursesCount)}
        />
        <CreatorStatCard
          detail="Unique enrollments across your creator-owned courses."
          icon={<Users className="h-5 w-5" />}
          label="Learners"
          value={String(metrics.learnersCount)}
        />
        <CreatorStatCard
          detail="Ratings are reserved for the marketplace layer."
          icon={<Star className="h-5 w-5" />}
          label="Rating"
          value={metrics.rating === null ? "—" : metrics.rating.toFixed(1)}
        />
      </section>

      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Next action
          </p>
          <h2 className="text-xl font-semibold text-slate-950">Create your first course</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Start a draft, add curriculum, and submit it for review when the foundation is ready.
          </p>
          <Button className="mt-5" onClick={() => router.push("/creator/courses/new")}>
            Create course
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
