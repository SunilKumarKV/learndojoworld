"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getMyFlashcards, getReviewDue, reviewFlashcard } from "@/services/memory.api";

export function FlashcardDeck() {
  const [flashcards, setFlashcards] = useState<
    Array<{ id: string; front: string; back: string; tags: string[] }>
  >([]);
  const [dueCards, setDueCards] = useState<
    Array<{ id: string; front: string; back: string; tags: string[] }>
  >([]);
  const [flipped, setFlipped] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      const [mine, due] = await Promise.all([getMyFlashcards(), getReviewDue(5)]);
      if (mine.success) setFlashcards(mine.data);
      if (due.success) setDueCards(due.data);
    })();
  }, []);

  const current = dueCards[activeIndex] ?? flashcards[activeIndex];

  const markDifficulty = async (difficulty: "FORGOT" | "HARD" | "GOOD" | "EASY") => {
    if (!current) return;
    await reviewFlashcard(current.id, difficulty);
    setDueCards((prev) => prev.filter((item) => item.id !== current.id));
    setActiveIndex(0);
    setFlipped(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Flashcards</p>
          <h2 className="text-2xl font-semibold text-slate-950">Review session</h2>
        </CardHeader>
        <CardContent>
          {current ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    className="min-h-[220px] cursor-pointer rounded-3xl bg-white p-6 shadow-soft-xl"
                    onClick={() => setFlipped((prev) => !prev)}
                    style={{ transformStyle: "preserve-3d" }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      animate={{ opacity: flipped ? 0 : 1 }}
                      className="absolute inset-0 flex items-center justify-center p-6 text-center text-lg font-semibold text-slate-900"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      {current.front}
                    </motion.div>
                    <motion.div
                      animate={{ opacity: flipped ? 1 : 0 }}
                      className="absolute inset-0 flex items-center justify-center p-6 text-center text-base text-slate-700"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      {current.back}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {current.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/8 px-3 py-1 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {(["FORGOT", "HARD", "GOOD", "EASY"] as const).map((difficulty) => (
                  <Button
                    key={difficulty}
                    size="sm"
                    variant="secondary"
                    onClick={() => void markDifficulty(difficulty)}
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              No cards due for review yet. Create a new flashcard to start your spaced repetition
              cycle.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deck</p>
          <h2 className="text-xl font-semibold text-slate-950">Your flashcards</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {flashcards.length === 0 ? (
            <p className="text-sm text-slate-600">No personal flashcards yet.</p>
          ) : (
            flashcards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card.front}</p>
                <p className="mt-1 text-sm text-slate-600">{card.back}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
