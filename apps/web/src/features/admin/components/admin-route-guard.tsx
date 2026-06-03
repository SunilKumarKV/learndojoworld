"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useSession } from "@/hooks/use-session";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

type AdminRole = (typeof ADMIN_ROLES)[number];

function isAdminRole(role: string | undefined): role is AdminRole {
  return !!role && ADMIN_ROLES.includes(role as AdminRole);
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, user } = useSession();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <LoadingState />;
  }

  return <>{children}</>;
}
