"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getRevisionDashboard } from "@/services/memory.api";

export function RevisionSummary() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getRevisionDashboard>>["data"] | null>(
    null,
  );

  useEffect(() => {
    void (async () => {
      const response = await getRevisionDashboard();
      if (response.success) setData(response.data);
    })();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Due today", value: data?.dueToday ?? 0 },
        { label: "Upcoming reviews", value: data?.upcomingReviews ?? 0 },
        { label: "Average quiz score", value: `${data?.averageScore ?? 0}%` },
        { label: "Flashcards due", value: data?.totalFlashcards ?? 0 },
      ].map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revision</p>
            <h3 className="text-xl font-semibold text-slate-950">{item.value}</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
