import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BillingInterval, BillingPlan, PlanCode } from "@/services/billing.api";

type PlanCardProps = {
  interval: BillingInterval;
  isCurrent: boolean;
  isPending: boolean;
  onUpgrade: (planCode: Exclude<PlanCode, "FREE">) => void;
  plan: BillingPlan;
};

export function PlanCard({ interval, isCurrent, isPending, onUpgrade, plan }: PlanCardProps) {
  const price = interval === "MONTHLY" ? plan.monthlyPrice : plan.yearlyPrice;
  const features = Array.isArray(plan.features)
    ? plan.features.filter((feature): feature is string => typeof feature === "string")
    : [];

  return (
    <Card className={isCurrent ? "border-primary/70" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {plan.code}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{plan.name}</h2>
          </div>
          {isCurrent ? (
            <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Current
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-slate-600">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-3xl font-semibold text-slate-950">
            {formatMoney(price, plan.currency)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {plan.code === "FREE"
              ? "Always free"
              : interval === "MONTHLY"
                ? "per month"
                : "per year"}
          </p>
        </div>

        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex gap-3 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {plan.code === "FREE" ? (
          <Button disabled className="w-full" variant="secondary">
            Included
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isCurrent || isPending}
            onClick={() => onUpgrade(plan.code === "PRO" ? "PRO" : "PREMIUM")}
          >
            {isCurrent ? "Current plan" : isPending ? "Creating checkout..." : "Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatMoney(amount: number, currency: string) {
  if (amount <= 0) return "₹0";

  return `${currency === "INR" ? "₹" : currency} ${(amount / 100).toLocaleString("en-IN")}`;
}
