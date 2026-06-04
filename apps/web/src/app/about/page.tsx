import { BrainCircuit, Compass, Layers3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { MarketingHero, PublicShell } from "@/features/marketing/public-shell";
import { JsonLd } from "@/lib/seo/json-ld";
import { createSeoMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd } from "@/lib/seo/structured-data";

export const metadata = createSeoMetadata({
  description:
    "LearnDojoWorld is building an AI learning platform where courses, memory systems, and creator-led education work together.",
  path: "/about",
  title: "About",
});

const principles = [
  {
    icon: BrainCircuit,
    title: "AI should support effort",
    text: "The AI Tutor is designed as guidance around real learning work, not a replacement for practice.",
  },
  {
    icon: Layers3,
    title: "Learning needs a system",
    text: "Courses, lessons, quizzes, flashcards, revision, analytics, and progress should live together.",
  },
  {
    icon: Compass,
    title: "Creators expand access",
    text: "Creator tools let skilled people package knowledge into structured courses with review and revenue foundations.",
  },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <JsonLd data={organizationJsonLd()} />
      <MarketingHero
        description="The mission is to help learners build durable knowledge with AI assistance, structured courses, memory-aware practice, and a creator economy that rewards useful teaching."
        eyebrow="About"
        title="A global learning platform built around focus, memory, and creators."
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {principles.map((principle) => (
            <Card key={principle.title}>
              <CardContent className="p-6">
                <principle.icon className="h-6 w-6 text-primary" />
                <h2 className="mt-5 text-xl font-semibold text-slate-950">{principle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{principle.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
          <h2 className="text-2xl font-semibold text-slate-950">What LearnDojoWorld is building</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            LearnDojoWorld brings together authenticated learner workflows, AI tutoring, public
            course discovery, creator course building, moderation, payments, subscriptions, and
            creator revenue accounting. The foundation is intentionally honest: paid access and
            subscriptions depend on verified payment webhooks, and creator payouts are review-only
            until real transfer operations are added.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
