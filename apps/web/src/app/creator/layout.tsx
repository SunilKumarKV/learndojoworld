import type { ReactNode } from "react";

import { CreatorRouteGuard } from "@/features/creator/components/creator-route-guard";
import { CreatorShell } from "@/features/creator/components/creator-shell";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <CreatorRouteGuard>
      <CreatorShell>{children}</CreatorShell>
    </CreatorRouteGuard>
  );
}
