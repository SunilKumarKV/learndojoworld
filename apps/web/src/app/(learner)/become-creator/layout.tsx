import type { Metadata } from "next";
import type { ReactNode } from "react";

import { createSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createSeoMetadata({
  description:
    "Become a LearnDojoWorld creator with course building, review submission, verified revenue attribution, and payout request foundations.",
  path: "/become-creator",
  title: "Become a Creator",
});

export default function BecomeCreatorLayout({ children }: { children: ReactNode }) {
  return children;
}
