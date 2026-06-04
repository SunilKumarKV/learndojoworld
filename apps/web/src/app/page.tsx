import { LandingPage } from "@/features/landing/landing-page";
import { JsonLd } from "@/lib/seo/json-ld";
import { createSeoMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";

export const metadata = createSeoMetadata({
  description:
    "LearnDojoWorld combines AI tutoring, expert courses, a memory engine, and creator-powered education in one global learning platform.",
  path: "/",
  title: "AI Learning, Courses, Memory Engine, and Creator Economy",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <LandingPage />
    </>
  );
}
