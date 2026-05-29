"use client";

import { useParams } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { QuizPlayer } from "@/features/quizzes/components/quiz-player";

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, isLoading } = useSession();

  if (isLoading) return <p className="p-10">Loading…</p>;
  if (!user) return <p className="p-10">Please sign in.</p>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <QuizPlayer quizId={params.id} />
      </div>
    </main>
  );
}
