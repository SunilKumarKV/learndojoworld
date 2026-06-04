import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseDetailClient } from "@/features/courses/components/course-detail-client";
import { JsonLd } from "@/lib/seo/json-ld";
import { createSeoMetadata } from "@/lib/seo/metadata";
import { getPublicCourseBySlug } from "@/lib/seo/server-data";
import { courseJsonLd } from "@/lib/seo/structured-data";

type CoursePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    return createSeoMetadata({
      description: "Explore AI-assisted courses and memory-aware learning on LearnDojoWorld.",
      path: `/course/${slug}`,
      title: "Course",
    });
  }

  return createSeoMetadata({
    description: course.subtitle ?? course.description,
    ...(course.thumbnailUrl ? { images: [course.thumbnailUrl] } : {}),
    path: `/course/${course.slug}`,
    title: course.title,
  });
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <>
      <JsonLd data={courseJsonLd(course)} />
      <CourseDetailClient />
    </>
  );
}
