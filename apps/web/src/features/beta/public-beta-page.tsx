"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { joinBetaWaitlist, type BetaWaitlistRoleInterest } from "@/services/beta.api";

const roleOptions: Array<{ label: string; value: BetaWaitlistRoleInterest }> = [
  { label: "Learner", value: "LEARNER" },
  { label: "Creator", value: "CREATOR" },
  { label: "Both", value: "BOTH" },
];

export function PublicBetaPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [roleInterest, setRoleInterest] = useState<BetaWaitlistRoleInterest>("LEARNER");

  const mutation = useMutation({
    mutationFn: () =>
      joinBetaWaitlist({
        email,
        ...(name.trim() ? { name: name.trim() } : {}),
        roleInterest,
        ...(source.trim() ? { source: source.trim() } : {}),
      }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setSource("");
      setRoleInterest("LEARNER");
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Controlled beta
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Join the LearnDojoWorld Beta
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Help shape an AI learning platform that combines courses, memory workflows, creator
              tools, and founder-led feedback loops before public launch.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["AI learning feedback", "Creator course input", "Founder onboarding"].map(
                (item) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">{item}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UsersRound className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Request beta access</h2>
                  <p className="text-sm text-slate-600">No payment or commitment required.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <select
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={roleInterest}
                onChange={(event) =>
                  setRoleInterest(event.target.value as BetaWaitlistRoleInterest)
                }
              >
                {roleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="How did you hear about us?"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />

              {mutation.isSuccess && (
                <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  You are on the beta waitlist.
                </p>
              )}
              {mutation.isError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Unable to join the waitlist."}
                </p>
              )}

              <Button
                className="w-full"
                disabled={!email || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                Join beta waitlist
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          {
            title: "Who it is for",
            body: "Learners who want AI-supported study loops and creators who want early input into the course marketplace foundation.",
          },
          {
            title: "What beta users get",
            body: "Founder-led onboarding, direct feedback channels, early creator workflows, and access to the learning engine during controlled rollout.",
          },
          {
            title: "How selection works",
            body: "The team reviews waitlist entries by role mix, creator readiness, and learning goals. Invitations are sent in small cohorts.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
