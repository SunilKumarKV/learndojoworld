import type { CourseDetail, CourseListItem } from "@/services/courses.api";
import type { PublicCreatorProfile } from "@/services/public-creators.api";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(
  /\/+$/g,
  "",
);

type ApiSuccess<T> = {
  success: true;
  data: T;
};

async function fetchApiData<T>(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      next: { revalidate: 300, ...(init?.next ?? {}) },
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as ApiSuccess<T>;

    return body.data;
  } catch {
    return null;
  }
}

export function getPublicCourses() {
  return fetchApiData<CourseListItem[]>("/courses");
}

export function getPublicCourseBySlug(slug: string) {
  return fetchApiData<CourseDetail>(`/courses/${encodeURIComponent(slug)}`);
}

export function getPublicCreatorByUsername(username: string) {
  return fetchApiData<PublicCreatorProfile>(`/public/creators/${encodeURIComponent(username)}`);
}
