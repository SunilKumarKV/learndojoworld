import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Learner Dashboard | LearnDojoWorld",
  description: "Protected learner dashboard for LearnDojoWorld.",
};

export default function LearnerRouteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
