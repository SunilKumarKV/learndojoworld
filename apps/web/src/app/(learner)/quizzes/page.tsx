"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { getQuizzes } from "@/services/memory.api";

export default function QuizzesPage() {
  const { user, isLoading } = useSession();
  const [quizzes, setQuizzes] = useState<Array<{ id: string; title: string; passScore: number }>>(
    [],
  );

  useEffect(() => {
    void (async () => {
      const response = await getQuizzes();
      if (response.success) {
        setQuizzes(response.data);
      }
    })();
  }, []);

  if (isLoading) return <p className="p-10">Loading…</p>;
  if (!user) return <p className="p-10">Please sign in.</p>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Memory engine</p>
            <h1 className="text-3xl font-semibold text-slate-950">Quizzes</h1>
            <p className="text-sm text-slate-600">
              Starter developer quizzes to reinforce what you just learned.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary"
                href={`/quiz/${quiz.id}`}
              >
                <p className="text-sm font-semibold text-slate-900">{quiz.title}</p>
                <p className="text-sm text-slate-600">Pass score {quiz.passScore}%</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
