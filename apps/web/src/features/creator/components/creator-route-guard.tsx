"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useSession } from "@/hooks/use-session";

export function CreatorRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user } = useSession();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role !== "CREATOR") {
      router.replace("/become-creator");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user || user.role !== "CREATOR") {
    return <LoadingState />;
  }

  return <>{children}</>;
}
