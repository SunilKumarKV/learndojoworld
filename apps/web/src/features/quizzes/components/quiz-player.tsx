"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getQuiz, submitQuizAttempt } from "@/services/memory.api";

export function QuizPlayer({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<Awaited<ReturnType<typeof getQuiz>>["data"] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof submitQuizAttempt>>["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const response = await getQuiz(quizId);
      if (response.success) {
        setQuiz(response.data);
      }
      setLoading(false);
    })();
  }, [quizId]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId]?.includes(option)
        ? prev[questionId].filter((item) => item !== option)
        : [...(prev[questionId] ?? []), option],
    }));
  };

  const handleSubmit = async () => {
    const response = await submitQuizAttempt(quizId, answers);
    if (response.success) {
      setResult(response.data);
    }
  };

  if (loading) {
    return <p>Loading quiz…</p>;
  }

  if (!quiz) {
    return <p>Quiz not available yet.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quiz</p>
          <h2 className="text-2xl font-semibold text-slate-950">{quiz.title}</h2>
          <p className="text-sm text-slate-600">Passing score: {quiz.passScore}%</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {index + 1}. {question.question}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Array.isArray(question.options) ? question.options : []).map((option) => (
                  <button
                    key={`${question.id}-${option}`}
                    className={`rounded-full border px-3 py-2 text-sm ${answers[question.id]?.includes(option) ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-700"}`}
                    onClick={() => handleSelect(question.id, option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={() => {
              void handleSubmit();
            }}
          >
            Submit quiz
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Result</p>
            <h3 className="text-xl font-semibold text-slate-950">Score: {result.score}%</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              {result.passed
                ? "You passed this checkpoint."
                : "Review the explanations below and try again."}
            </p>
            {result.weakTopics.length > 0 ? (
              <p>Weak areas: {result.weakTopics.join(", ")}</p>
            ) : null}
            <ul className="list-disc space-y-1 pl-5">
              {result.explanations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
