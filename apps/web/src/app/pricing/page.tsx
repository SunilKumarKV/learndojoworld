import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MarketingHero, PublicShell } from "@/features/marketing/public-shell";
import { createSeoMetadata } from "@/lib/seo/metadata";

export const metadata = createSeoMetadata({
  description:
    "Compare LearnDojoWorld Free, Pro, and Premium plans for AI tutoring usage, learning workflows, and creator-ready education.",
  path: "/pricing",
  title: "Pricing",
});

const plans = [
  {
    code: "FREE",
    cta: "Start learning",
    description: "A focused starting point for learners using courses and light AI help.",
    features: ["20 AI messages per day", "300 AI messages per month", "Course catalog access"],
    href: "/register",
    name: "Free",
    price: "₹0",
  },
  {
    code: "PRO",
    cta: "Upgrade from billing",
    description: "More AI capacity for active learners building a consistent routine.",
    features: [
      "200 AI messages per day",
      "3,000 AI messages per month",
      "Monthly or yearly checkout",
    ],
    href: "/billing",
    name: "Pro",
    price: "₹499/mo",
  },
  {
    code: "PREMIUM",
    cta: "Upgrade from billing",
    description: "Higher AI capacity for intensive study and deeper learning workflows.",
    features: [
      "1,000 AI messages per day",
      "15,000 AI messages per month",
      "Monthly or yearly checkout",
    ],
    href: "/billing",
    name: "Premium",
    price: "₹1,499/mo",
  },
];

export default function PricingPage() {
  return (
    <PublicShell>
      <MarketingHero
        description="Plans are enforced server-side. Paid plans activate only after verified payment webhooks, keeping billing honest and secure."
        eyebrow="Pricing"
        title="Simple AI learning plans for different study intensity."
      />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        {plans.map((plan) => (
          <Card className={plan.code === "PRO" ? "border-primary/70" : undefined} key={plan.code}>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {plan.code}
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">{plan.name}</h2>
              <p className="text-sm leading-6 text-slate-600">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-4xl font-semibold text-slate-950">{plan.price}</p>
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div className="flex gap-3 text-sm text-slate-700" key={feature}>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                asChild
                className="w-full"
                variant={plan.code === "FREE" ? "secondary" : "primary"}
              >
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </PublicShell>
  );
}
