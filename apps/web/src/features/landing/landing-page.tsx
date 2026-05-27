"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, CheckCircle2, Compass, Layers3, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LEARNER_MODES, SITE_CONFIG } from "@/constants/site";
import { cn } from "@/lib/utils";
import { useLearningModeStore } from "@/stores/use-learning-mode-store";

const creatorSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

type CreatorFormValues = z.infer<typeof creatorSchema>;

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const valuePillars = [
  {
    icon: BrainCircuit,
    title: "Adaptive guidance",
    body: "A learning layer designed to understand goals, pace, recall, and next best steps.",
  },
  {
    icon: Layers3,
    title: "Operating system mindset",
    body: "Courses, notes, practice, and progress belong in one durable learner workspace.",
  },
  {
    icon: Compass,
    title: "Global learner paths",
    body: "The foundation is ready for structured paths across skills, careers, and exams.",
  },
];

const courseTracks = ["AI foundations", "Product thinking", "English fluency", "Career readiness"];

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
          <a href="#creators">Join waitlist</a>
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
            Phase 1: foundation plus learner MVP
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            LearnDojoWorld
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            A startup-grade AI learning operating system for focused learners, memory-aware
            practice, and course discovery that can grow into a global education platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#memory">
                Explore foundation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#creators">Creator interest</a>
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
            <h2 className="mt-2 text-2xl font-bold text-foreground">Today&apos;s learning loop</h2>
          </div>
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Ready
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {["Recall weak concepts", "Resume active path", "Discover next course"].map(
          (item, index) => (
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
          ),
        )}
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
          title="A foundation for learning that adapts before it overwhelms."
          body="The Phase 1 surface is intentionally focused: prove the learner loop, make progress visible, and keep future AI systems grounded in clean product boundaries."
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
          body="This preview models the learner memory layer without implementing the complete engine yet."
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
          title="A cleaner way to find what to learn next."
          inverted
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {courseTracks.map((track) => (
            <div key={track} className="rounded-lg border border-white/14 bg-white/8 p-5">
              <p className="text-sm font-semibold text-cyan-200">Track</p>
              <h3 className="mt-3 text-lg font-bold">{track}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Structured for learner goals, practice loops, and future AI recommendations.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CreatorCta() {
  const {
    formState: { errors, isSubmitSuccessful },
    handleSubmit,
    register,
  } = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(_: CreatorFormValues) {
    return undefined;
  }

  return (
    <section className="py-20" id="creators">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8">
        <SectionIntro
          eyebrow="Creator CTA"
          title="Build learning paths for a world that needs better guidance."
          body="Creator workflows are not implemented yet. This foundation reserves the right surface for future course builders, mentors, and learning communities."
        />
        <Card className="bg-white/90">
          <CardHeader>
            <h3 className="text-2xl font-bold">Creator interest</h3>
            <p className="leading-7 text-muted-foreground">
              A local-only form foundation for the future creator waitlist.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
              <label className="sr-only" htmlFor="creator-email">
                Email
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="h-12 flex-1 rounded-md border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  id="creator-email"
                  placeholder="creator@company.com"
                  type="email"
                  {...register("email")}
                />
                <Button type="submit">Register interest</Button>
              </div>
              {errors.email ? (
                <p className="text-sm font-medium text-accent">{errors.email.message}</p>
              ) : null}
              {isSubmitSuccessful ? (
                <p className="text-sm font-medium text-primary">Interest captured locally.</p>
              ) : null}
            </form>
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
        <p>Production foundation for the learner MVP.</p>
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
