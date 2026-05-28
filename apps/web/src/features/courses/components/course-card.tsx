import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CourseListItem } from "@/services/courses.api";

export function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>{course.category?.name ?? "General"}</span>
          <span>{course.difficulty}</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-slate-950">{course.title}</h3>
        <p className="text-sm text-slate-600">{course.subtitle ?? course.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">{course.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">{course.language}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{course.moduleCount} modules</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {course.enrollmentCount} learners
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-sm font-semibold text-primary">
            {course.isFree ? "Free" : `${course.price} ${course.currency}`}
          </p>
          <Button asChild variant="secondary">
            <Link href={`/course/${course.slug}`}>View course</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
