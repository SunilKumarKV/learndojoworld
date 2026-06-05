"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitFeedback, type FeedbackType } from "@/services/beta.api";

const feedbackTypes: Array<{ label: string; value: FeedbackType }> = [
  { label: "Bug", value: "BUG" },
  { label: "Feature request", value: "FEATURE_REQUEST" },
  { label: "Confusion", value: "CONFUSION" },
  { label: "General feedback", value: "GENERAL_FEEDBACK" },
];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("GENERAL_FEEDBACK");
  const [message, setMessage] = useState("");
  const [path, setPath] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitFeedback({
        message,
        ...(path.trim() ? { path: path.trim() } : {}),
        type,
      }),
    onSuccess: () => {
      setMessage("");
      setPath("");
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Beta feedback
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Help shape LearnDojoWorld.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share bugs, confusing flows, or product ideas from your beta experience.
        </p>
      </section>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Type
            <select
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as FeedbackType)}
            >
              {feedbackTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Page or workflow
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="/ai, /course/..., onboarding, billing"
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Feedback
            <textarea
              className="min-h-40 w-full rounded-md border border-slate-300 p-3 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          {mutation.isSuccess && (
            <p className="text-sm font-semibold text-green-700">Feedback received. Thank you.</p>
          )}
          {mutation.isError && (
            <p className="text-sm font-semibold text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to send feedback."}
            </p>
          )}

          <Button
            disabled={message.trim().length < 8 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Send className="h-4 w-4" />
            Send feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
