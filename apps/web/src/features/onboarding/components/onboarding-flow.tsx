"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import type { OnboardingStatusResponse } from "@/services/onboarding.api";
import {
  onboardingSchema,
  type OnboardingFormInput,
  type OnboardingFormValues,
} from "@/features/onboarding/schemas/onboarding.schema";

const learningGoals = [
  "Get a developer job",
  "Prepare for interview",
  "Learn full stack",
  "Improve college/MCA skills",
  "Build startup/projects",
];

const topics = ["JavaScript", "React", "Node.js", "DSA", "System Design", "TypeScript"];

const dailyOptions = [15, 30, 60, 90];

const learningStyles = ["videos", "quizzes", "flashcards", "AI explanations", "projects"];

const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export function OnboardingFlow({
  initialProfile,
}: {
  initialProfile?: OnboardingStatusResponse | undefined;
}) {
  const [step, setStep] = useState(0);
  const { mutateAsync, isPending, isError, error } = useOnboarding();

  const form = useForm<OnboardingFormInput, unknown, OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      goals: [],
      topics: [],
      level: "BEGINNER",
      dailyGoalMin: 30,
      learningStyle: [],
    },
  });

  const progress = useMemo(() => ((step + 1) / 5) * 100, [step]);

  useEffect(() => {
    form.reset({
      dailyGoalMin: initialProfile?.dailyGoalMin ?? 30,
      goals: initialProfile?.goals ?? [],
      learningStyle: initialProfile?.learningStyle ?? [],
      level: (initialProfile?.level ?? "BEGINNER") as OnboardingFormValues["level"],
      topics: initialProfile?.topics ?? [],
    });
  }, [form, initialProfile]);

  const onSubmit = async (values: OnboardingFormValues) => {
    await mutateAsync(values);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onSubmit)(event);
  };

  const nextStep = async () => {
    const fieldsByStep: (keyof OnboardingFormValues)[][] = [
      ["goals"],
      ["topics"],
      ["level"],
      ["dailyGoalMin"],
      ["learningStyle"],
    ];

    const fieldsToValidate = fieldsByStep[step] ?? [];
    const valid = await form.trigger(fieldsToValidate);

    if (valid) {
      setStep((current) => Math.min(current + 1, 4));
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-soft-xl">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Learner onboarding</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Build your first learning path
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
              Share your goals and preferences so your dashboard can feel tailored from day one.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100">
            Step {step + 1} of 5 · {Math.round(progress)}% complete
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {step === 0 && (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 1
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  What is your main learning goal?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {learningGoals.map((goal) => {
                  const selected = form.watch("goals").includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.getValues("goals").filter((item) => item !== goal)
                          : [...form.getValues("goals"), goal];
                        form.setValue("goals", next, { shouldValidate: true });
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/8 shadow-soft-xl"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {selected && <Check className="h-4 w-4 text-primary" />}
                        {goal}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.goals && (
                <p className="text-sm text-red-600">{form.formState.errors.goals.message}</p>
              )}
            </section>
          )}

          {step === 1 && (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 2
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Which topics matter most right now?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {topics.map((topic) => {
                  const selected = form.watch("topics").includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.getValues("topics").filter((item) => item !== topic)
                          : [...form.getValues("topics"), topic];
                        form.setValue("topics", next, { shouldValidate: true });
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/8 shadow-soft-xl"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {selected && <Check className="h-4 w-4 text-primary" />}
                        {topic}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.topics && (
                <p className="text-sm text-red-600">{form.formState.errors.topics.message}</p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 3
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  How confident are you today?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {skillLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => form.setValue("level", level, { shouldValidate: true })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.watch("level") === level
                        ? "border-primary bg-primary/8 shadow-soft-xl"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{level}</span>
                  </button>
                ))}
              </div>
              {form.formState.errors.level && (
                <p className="text-sm text-red-600">{form.formState.errors.level.message}</p>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 4
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  How much time can you commit each day?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {dailyOptions.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => form.setValue("dailyGoalMin", minutes, { shouldValidate: true })}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.watch("dailyGoalMin") === minutes
                        ? "border-primary bg-primary/8 shadow-soft-xl"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-slate-900">{minutes} min</span>
                  </button>
                ))}
              </div>
              {form.formState.errors.dailyGoalMin && (
                <p className="text-sm text-red-600">{form.formState.errors.dailyGoalMin.message}</p>
              )}
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 5
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  What learning formats do you prefer?
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {learningStyles.map((style) => {
                  const selected = form.watch("learningStyle").includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.getValues("learningStyle").filter((item) => item !== style)
                          : [...form.getValues("learningStyle"), style];
                        form.setValue("learningStyle", next, { shouldValidate: true });
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/8 shadow-soft-xl"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {selected && <Check className="h-4 w-4 text-primary" />}
                        {style}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.formState.errors.learningStyle && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.learningStyle.message}
                </p>
              )}
            </section>
          )}

          {isError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error instanceof Error ? error.message : "We could not save your onboarding plan."}
            </div>
          )}

          {step === 4 && (
            <div className="rounded-3xl border border-primary/15 bg-primary/6 p-5 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <p>
                  Your choices will shape the early learner dashboard shell and guide the next
                  learning experience.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button type="button" onClick={() => void nextStep()}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Finish onboarding"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
