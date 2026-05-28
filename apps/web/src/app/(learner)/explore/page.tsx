"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CourseCard } from "@/features/courses/components/course-card";
import { useCategories, useCourses } from "@/features/courses/hooks/use-courses";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const {
    data: courses = [],
    isLoading,
    isError,
    error,
  } = useCourses({
    category: category === "ALL" ? undefined : category,
    difficulty: difficulty === "ALL" ? undefined : difficulty,
    search: search || undefined,
  });

  const hasFilters = useMemo(
    () => Boolean(search || difficulty !== "ALL" || category !== "ALL"),
    [category, difficulty, search],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Explore</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Discover real developer-learning courses.
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Browse public courses, filter by difficulty and category, and use the foundation for the
            next learner experience layer.
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-950">Search & filters</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-2 block">Search</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="React, JavaScript, APIs..."
                value={search}
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-2 block">Difficulty</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                onChange={(event) => setDifficulty(event.target.value)}
                value={difficulty}
              >
                <option value="ALL">All levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-2 block">Category</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="ALL">All categories</option>
                {!categoriesLoading &&
                  categories.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-600">
              Loading the public course catalog…
            </CardContent>
          </Card>
        ) : null}

        {isError ? (
          <Card>
            <CardContent className="p-8 text-sm text-red-700">
              {error instanceof Error ? error.message : "We could not load the catalog."}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && courses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-600">
              {hasFilters
                ? "No courses match these filters yet."
                : "No published courses are available right now."}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        ) : null}

        <div className="flex justify-start">
          <Button
            variant="secondary"
            onClick={() => {
              setSearch("");
              setDifficulty("ALL");
              setCategory("ALL");
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>
    </main>
  );
}
