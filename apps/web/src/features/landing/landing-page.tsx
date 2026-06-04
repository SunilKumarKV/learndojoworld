"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Layers3,
  ReceiptText,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LEARNER_MODES, SITE_CONFIG } from "@/constants/site";
import { cn } from "@/lib/utils";
import { useLearningModeStore } from "@/stores/use-learning-mode-store";

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const valuePillars = [
  {
    icon: BrainCircuit,
    title: "AI Tutor",
    body: "Ask for help while learning, with server-side plan limits and provider-backed responses.",
  },
  {
    icon: Layers3,
    title: "Courses and progress",
    body: "Discover published courses, enroll, track lessons, attempt quizzes, and keep momentum visible.",
  },
  {
    icon: Compass,
    title: "Memory engine",
    body: "Flashcards, revision, XP, streaks, and analytics turn learning into a repeatable loop.",
  },
];

const courseTracks = [
  "AI-assisted study",
  "Public course catalog",
  "Revision workflow",
  "Creator-led paths",
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader />
      <HeroSection />
      <AiLearningValue />
      <MemoryEnginePreview />
      <CourseDiscoveryPreview />
      <CreatorCta />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/84 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <a
          className="text-base font-bold text-foreground"
          href="#"
          aria-label="LearnDojoWorld home"
        >
          LearnDojoWorld
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          {SITE_CONFIG.links.map((item) => (
            <a
              key={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm" variant="secondary">
          <a href="/login">Sign in</a>
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8 lg:py-20">
        <motion.div
          animate="show"
          className="max-w-3xl"
          initial="hidden"
          transition={{ duration: 0.55, ease: "easeOut" }}
          variants={fadeIn}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            AI learning platform for learners and creators
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            LearnDojoWorld
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            LearnDojoWorld brings AI tutoring, published courses, a memory engine, subscriptions,
            payments, creator tools, and revenue foundations into one focused learning platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/explore">
                Explore courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="/become-creator">Become a creator</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          animate="show"
          initial="hidden"
          transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
          variants={fadeIn}
        >
          <LearningConsole />
        </motion.div>
      </div>
    </section>
  );
}

function LearningConsole() {
  return (
    <Card className="relative overflow-hidden border-slate-200/80 bg-white/88">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Learner cockpit</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">A complete learning loop</h2>
          </div>
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Ready
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {["Ask AI Tutor", "Resume a lesson", "Review weak concepts"].map((item, index) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">{item}</span>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AiLearningValue() {
  return (
    <section className="border-y bg-white/62 py-20" id="value">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionIntro
          eyebrow="AI learning value"
          title="Built for serious learning, not scattered tabs."
          body="LearnDojoWorld connects course learning, AI guidance, revision, and measurable progress so learners can keep moving without losing context."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {valuePillars.map((pillar) => (
            <Card key={pillar.title} className="bg-card/92 shadow-none">
              <CardHeader>
                <pillar.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h3 className="text-xl font-bold">{pillar.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{pillar.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemoryEnginePreview() {
  const { mode, setMode } = useLearningModeStore();

  return (
    <section className="py-20" id="memory">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <SectionIntro
          eyebrow="Memory engine preview"
          title="Recall, review, and rhythm belong at the center."
          body="Flashcards, revision queues, streaks, XP, and analytics keep knowledge from evaporating after a lesson ends."
        />
        <Card className="bg-white/88">
          <CardHeader>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Learner mode">
              {LEARNER_MODES.map((item) => (
                <button
                  key={item}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-semibold transition-colors",
                    mode === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setMode(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Focus", "Recall", "Momentum"].map((label, index) => (
                <div key={label} className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-foreground">{72 + index * 8}%</p>
                  <p className="mt-2 text-sm text-muted-foreground">{mode} mode baseline</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CourseDiscoveryPreview() {
  return (
    <section className="bg-slate-950 py-20 text-white" id="courses">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionIntro
          body="The discovery layer starts simple: clear tracks, learner fit, and a path toward deeper personalization later."
          eyebrow="Course discovery preview"
          title="Courses that can grow with a creator marketplace."
          inverted
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {courseTracks.map((track) => (
            <div key={track} className="rounded-lg border border-white/14 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">Track</p>
              <h3 className="mt-3 text-lg font-bold">{track}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Structured for learner goals, progress tracking, revision, and AI-assisted support.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreatorCta() {
  return (
    <section className="py-20" id="creators">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8">
        <SectionIntro
          eyebrow="Creator economy"
          title="Creators can build, submit, publish, and earn from courses."
          body="Creator Studio includes course drafts, curriculum building, moderation handoff, paid course checkout, verified revenue attribution, payout profiles, and payout request review."
        />
        <Card className="bg-white/90">
          <CardHeader>
            <h3 className="text-2xl font-bold">Creator foundation</h3>
            <p className="leading-7 text-muted-foreground">
              Start as a learner, upgrade to creator, and keep both learning and teaching abilities
              in one account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {[
                { icon: Layers3, text: "Create course drafts with modules and text lessons." },
                { icon: ReceiptText, text: "Submit courses for admin review before publishing." },
                {
                  icon: Wallet,
                  text: "Track verified creator earnings and request payout review.",
                },
              ].map((item) => (
                <div className="flex gap-3 rounded-lg border bg-background p-4" key={item.text}>
                  <item.icon className="mt-0.5 h-5 w-5 flex-none text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <Button asChild>
              <a href="/become-creator">
                Open Creator Studio
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t bg-white/72 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>LearnDojoWorld</p>
        <div className="flex flex-wrap gap-4">
          <a href="/pricing">Pricing</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function SectionIntro({
  body,
  eyebrow,
  inverted = false,
  title,
}: Readonly<{
  body: string;
  eyebrow: string;
  inverted?: boolean;
  title: string;
}>) {
  return (
    <div className="max-w-2xl">
      <p className={cn("text-sm font-bold uppercase", inverted ? "text-cyan-200" : "text-primary")}>
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 text-3xl font-bold leading-tight sm:text-4xl",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-base leading-8",
          inverted ? "text-slate-300" : "text-muted-foreground",
        )}
      >
        {body}
      </p>
    </div>
  );
}
