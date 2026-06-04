import type { ReactNode } from "react";

import { SITE_CONFIG } from "@/constants/site";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <a className="text-lg font-bold text-slate-950" href="/">
            {SITE_CONFIG.name}
          </a>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
            {SITE_CONFIG.links.map((link) => (
              <a
                className="rounded-md px-3 py-2 hover:bg-slate-100"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
            <a className="rounded-md px-3 py-2 hover:bg-slate-100" href="/contact">
              Contact
            </a>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

export function MarketingHero({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
      </div>
    </section>
  );
}
