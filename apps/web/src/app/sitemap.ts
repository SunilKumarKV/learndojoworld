import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/metadata";
import { getPublicCourses } from "@/lib/seo/server-data";

const staticRoutes = ["/", "/pricing", "/become-creator", "/about", "/contact", "/explore"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublicCourses();
  const now = new Date();
  const courseRoutes =
    courses?.map((course) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.7,
      url: absoluteUrl(`/course/${course.slug}`),
    })) ?? [];

  return [
    ...staticRoutes.map((route) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: route === "/" ? 1 : 0.8,
      url: absoluteUrl(route),
    })),
    ...courseRoutes,
  ];
}
