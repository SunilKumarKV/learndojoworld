import { SITE_CONFIG } from "@/constants/site";
import type { CourseDetail } from "@/services/courses.api";
import type { PublicCreatorProfile } from "@/services/public-creators.api";
import { absoluteUrl } from "./metadata";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      query: "required name=search_term_string",
      target: `${absoluteUrl("/explore")}?search={search_term_string}`,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    description: SITE_CONFIG.description,
    name: SITE_CONFIG.name,
    url: absoluteUrl("/"),
  };
}

export function courseJsonLd(course: CourseDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    courseCode: course.slug,
    description: course.description,
    educationalLevel: course.difficulty,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
    },
    inLanguage: course.language,
    name: course.title,
    offers: {
      "@type": "Offer",
      category: course.isFree ? "Free" : "Paid",
      price: course.isFree ? 0 : (course.price ?? 0),
      priceCurrency: course.currency,
      url: absoluteUrl(`/course/${course.slug}`),
    },
    provider: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: absoluteUrl("/"),
    },
  };
}

export function creatorJsonLd(creator: PublicCreatorProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    description: creator.bio,
    name: creator.displayName,
    url: absoluteUrl(`/creator/${creator.username}`),
    worksFor: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
    },
  };
}
