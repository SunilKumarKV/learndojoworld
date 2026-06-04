import type { Metadata } from "next";
import type { ReactNode } from "react";

import { createSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createSeoMetadata({
  description:
    "Explore LearnDojoWorld public courses with difficulty, category, and search filters for AI-assisted learning paths.",
  path: "/explore",
  title: "Explore Courses",
});

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return children;
}
