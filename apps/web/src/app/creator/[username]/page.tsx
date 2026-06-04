import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicShell } from "@/features/marketing/public-shell";
import { JsonLd } from "@/lib/seo/json-ld";
import { createSeoMetadata } from "@/lib/seo/metadata";
import { getPublicCreatorByUsername } from "@/lib/seo/server-data";
import { creatorJsonLd } from "@/lib/seo/structured-data";

type CreatorPageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getPublicCreatorByUsername(username);

  if (!creator) {
    return createSeoMetadata({
      description: "Explore LearnDojoWorld creators and their published courses.",
      path: `/creator/${username}`,
      title: "Creator",
    });
  }

  return createSeoMetadata({
    description:
      creator.bio ??
      `${creator.displayName} teaches on LearnDojoWorld with published creator-led courses.`,
    path: `/creator/${creator.username}`,
    title: creator.displayName,
  });
}

export default async function PublicCreatorPage({ params }: CreatorPageProps) {
  const { username } = await params;
  const creator = await getPublicCreatorByUsername(username);

  if (!creator) {
    notFound();
  }

  return (
    <PublicShell>
      <JsonLd data={creatorJsonLd(creator)} />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Creator</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {creator.displayName}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            {creator.bio ?? "This creator is building learning paths on LearnDojoWorld."}
          </p>
          {creator.expertise.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {creator.expertise.map((item) => (
                <span
                  className="rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Courses
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Published courses</h2>
          </div>
          <Button asChild variant="secondary">
            <a href="/explore">Explore all courses</a>
          </Button>
        </div>

        {creator.courses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm leading-6 text-slate-600">
              This creator does not have published courses yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {creator.courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {course.category?.name ?? course.difficulty}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {course.subtitle ?? `${course.moduleCount} modules · ${course.difficulty}`}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {course.isFree ? "Free" : `${course.currency} ${course.price?.toFixed(2)}`}
                    </span>
                    <Button asChild size="sm">
                      <a href={`/course/${course.slug}`}>View course</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
