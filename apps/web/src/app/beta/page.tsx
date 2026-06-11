import { PublicBetaPage } from "@/features/beta/public-beta-page";
import { createSeoMetadata } from "@/lib/seo/metadata";

export const metadata = createSeoMetadata({
  description:
    "Join the LearnDojoWorld controlled beta for AI learning, courses, memory workflows, and creator-powered education.",
  path: "/beta",
  title: "Join the LearnDojoWorld Beta",
});

export default function BetaPage() {
  return <PublicBetaPage />;
}
