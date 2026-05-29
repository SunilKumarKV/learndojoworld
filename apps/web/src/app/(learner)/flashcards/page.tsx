"use client";

import { useSession } from "@/hooks/use-session";
import { FlashcardDeck } from "@/features/flashcards/components/flashcard-deck";

export default function FlashcardsPage() {
  const { user, isLoading } = useSession();

  if (isLoading) return <p className="p-10">Loading…</p>;
  if (!user) return <p className="p-10">Please sign in.</p>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FlashcardDeck />
      </div>
    </main>
  );
}
