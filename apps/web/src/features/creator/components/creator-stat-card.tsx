import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CreatorStatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
      </CardContent>
    </Card>
  );
}
