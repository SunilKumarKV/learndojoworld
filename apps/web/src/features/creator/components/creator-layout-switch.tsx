"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { CreatorRouteGuard } from "@/features/creator/components/creator-route-guard";
import { CreatorShell } from "@/features/creator/components/creator-shell";

const protectedCreatorPrefixes = [
  "/creator/dashboard",
  "/creator/courses",
  "/creator/settings",
  "/creator/revenue",
  "/creator/payouts",
];

export function CreatorLayoutSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProtectedCreatorArea = protectedCreatorPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtectedCreatorArea) {
    return <>{children}</>;
  }

  return (
    <CreatorRouteGuard>
      <CreatorShell>{children}</CreatorShell>
    </CreatorRouteGuard>
  );
}
