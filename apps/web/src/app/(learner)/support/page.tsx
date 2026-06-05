"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquareWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitSupportRequest } from "@/services/beta.api";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [path, setPath] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitSupportRequest({
        message,
        ...(path.trim() ? { path: path.trim() } : {}),
        subject,
      }),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setPath("");
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Beta support
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Report an issue.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Send problems that block learning, payments, AI usage, creator workflows, or admin review.
        </p>
      </section>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Subject
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Page or workflow
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="/billing, /ai, lesson player, creator builder"
              value={path}
              onChange={(event) => setPath(event.target.value)}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Issue
            <textarea
              className="min-h-40 w-full rounded-md border border-slate-300 p-3 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          {mutation.isSuccess && (
            <p className="text-sm font-semibold text-green-700">Support request received.</p>
          )}
          {mutation.isError && (
            <p className="text-sm font-semibold text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to send support request."}
            </p>
          )}

          <Button
            disabled={subject.trim().length < 4 || message.trim().length < 8 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <MessageSquareWarning className="h-4 w-4" />
            Report issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
