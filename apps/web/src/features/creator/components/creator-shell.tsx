"use client";

import { BookOpen, Compass, IndianRupee, LayoutDashboard, Settings, Wallet } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/creator/courses", label: "Courses", icon: BookOpen },
  { href: "/creator/revenue", label: "Revenue", icon: IndianRupee },
  { href: "/creator/payouts", label: "Payouts", icon: Wallet },
  { href: "/creator/settings", label: "Settings", icon: Settings },
];

export function CreatorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Creator Studio
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              LearnDojoWorld
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Creator navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  )}
                  href={item.href as Route}
                  key={item.href}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button asChild size="sm" variant="secondary">
              <Link href="/dashboard">
                <Compass aria-hidden className="h-4 w-4" />
                Learner
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
