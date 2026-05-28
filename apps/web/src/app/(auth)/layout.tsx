import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Authentication | LearnDojoWorld",
  description: "Secure learner authentication pages for LearnDojoWorld.",
};

export default function AuthRouteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
