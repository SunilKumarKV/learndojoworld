"use client";

import { useParams } from "next/navigation";

import { CourseBuilder } from "@/features/creator/components/course-builder/course-builder";

export default function EditCreatorCoursePage() {
  const params = useParams();
  const courseId = typeof params.id === "string" ? params.id : undefined;

  return <CourseBuilder courseId={courseId} />;
}
