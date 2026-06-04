import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { AIUsageSummary } from "@/services/billing.api";

type AIUsageMeterProps = {
  usage: AIUsageSummary | null | undefined;
  compact?: boolean;
  showUpgrade?: boolean;
};

export function AIUsageMeter({ compact = false, showUpgrade = true, usage }: AIUsageMeterProps) {
  const todayPercent = percent(usage?.messagesUsedToday ?? 0, usage?.dailyLimit ?? 0);
  const monthPercent = percent(usage?.messagesUsedThisMonth ?? 0, usage?.monthlyLimit ?? 0);
  const isLimitReached =
    Boolean(usage) &&
    ((usage?.messagesUsedToday ?? 0) >= (usage?.dailyLimit ?? 0) ||
      (usage?.messagesUsedThisMonth ?? 0) >= (usage?.monthlyLimit ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            AI usage
          </p>
          <h2
            className={
              compact
                ? "text-lg font-semibold text-slate-950"
                : "text-xl font-semibold text-slate-950"
            }
          >
            {usage?.planCode ?? "FREE"} plan
          </h2>
        </div>
        {showUpgrade && usage?.planCode !== "PREMIUM" ? (
          <Button asChild size="sm" variant={isLimitReached ? "primary" : "secondary"}>
            <Link href="/billing">Upgrade</Link>
          </Button>
        ) : null}
      </div>

      <UsageBar
        label="Today"
        limit={usage?.dailyLimit ?? 0}
        percent={todayPercent}
        used={usage?.messagesUsedToday ?? 0}
      />
      <UsageBar
        label="This month"
        limit={usage?.monthlyLimit ?? 0}
        percent={monthPercent}
        used={usage?.messagesUsedThisMonth ?? 0}
      />
    </div>
  );
}

function UsageBar({
  label,
  limit,
  percent,
  used,
}: {
  label: string;
  limit: number;
  percent: number;
  used: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {used} / {limit}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function percent(used: number, limit: number) {
  if (limit <= 0) return 0;

  return Math.min(100, Math.round((used / limit) * 100));
}
