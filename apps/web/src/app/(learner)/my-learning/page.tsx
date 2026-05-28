"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMyLearning } from "@/features/learning/hooks/use-my-learning";

export default function MyLearningPage() {
  const { data: enrollments = [], isLoading, isError, error } = useMyLearning();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              My learning
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Your enrolled learning foundation.
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Progress and continue-learning placeholders are ready for the next learner operations
              layer.
            </p>
          </CardHeader>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-600">
              Loading your learning list…
            </CardContent>
          </Card>
        ) : null}
        {isError ? (
          <Card>
            <CardContent className="p-8 text-sm text-red-700">
              {error instanceof Error ? error.message : "We could not load your learning."}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && enrollments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-600">
              You have not enrolled in any courses yet. Explore the public catalog to begin.
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && enrollments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((item) => (
              <Card key={item.id} className="h-full">
                <CardHeader>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Enrolled</p>
                  <h2 className="text-xl font-semibold text-slate-950">{item.course.title}</h2>
                  <p className="text-sm text-slate-600">
                    {item.course.subtitle ??
                      "Continue your learning path from the course detail page."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <p>Progress: {item.progressPercent}%</p>
                  <p>Difficulty: {item.course.difficulty}</p>
                  <p>
                    Price:{" "}
                    {item.course.isFree
                      ? "Free"
                      : `${item.course.price ?? 0} ${item.course.currency}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
