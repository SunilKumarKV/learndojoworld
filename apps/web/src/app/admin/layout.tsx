"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminRouteGuard } from "@/features/admin/components/admin-route-guard";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Course review" },
  { href: "/admin/payouts", label: "Payout review" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/beta", label: "Beta ops" },
];

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-8">
          <aside className="hidden w-80 shrink-0 rounded-3xl border bg-white p-6 shadow-soft-xl lg:block">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Admin</p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950">Moderation</h1>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={
                      isActive
                        ? "block rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
                        : "block rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              Admin tools for creator course review and payout request decisions. Actions are
              tracked in the audit log.
            </div>
          </aside>
          <main className="min-h-screen flex-1">{children}</main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
