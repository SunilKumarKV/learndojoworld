"use client";

import { useSession } from "@/hooks/use-session";
import { RevisionSummary } from "@/features/revision/components/revision-summary";

export default function RevisionPage() {
  const { user, isLoading } = useSession();

  if (isLoading) return <p className="p-10">Loading…</p>;
  if (!user) return <p className="p-10">Please sign in.</p>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <RevisionSummary />
      </div>
    </main>
  );
}
