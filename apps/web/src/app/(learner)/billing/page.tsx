"use client";

import { CreditCard, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AIUsageMeter } from "@/features/ai/ai-usage-meter";
import { PlanCard } from "@/features/billing/plan-card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useSession } from "@/hooks/use-session";
import {
  BillingInterval,
  PlanCode,
  getBillingPlans,
  getMyBilling,
  subscribeToPlan,
} from "@/services/billing.api";
import { getMyPayments } from "@/services/payments.api";

export default function BillingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: sessionLoading, user } = useSession();
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
  const [gateway, setGateway] = useState<"stripe" | "razorpay">("stripe");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const billingQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getMyBilling,
    queryKey: ["billing", "me"],
  });
  const plansQuery = useQuery({
    queryFn: getBillingPlans,
    queryKey: ["billing", "plans"],
  });
  const paymentsQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getMyPayments,
    queryKey: ["payments", "me"],
  });

  const subscribeMutation = useMutation({
    mutationFn: (planCode: Exclude<PlanCode, "FREE">) =>
      subscribeToPlan({ gateway, interval, planCode }),
    onSuccess: async (response) => {
      const checkout = response.data.checkout;
      await queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
      setCheckoutMessage(
        checkout.providerConfigured
          ? "Checkout created. Complete payment with the provider to activate this plan."
          : "Pending subscription checkout created. Provider keys are not configured locally.",
      );

      if (checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl;
      }
    },
  });

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace("/login?next=/billing");
    }
  }, [router, sessionLoading, user]);

  if (sessionLoading || billingQuery.isLoading || plansQuery.isLoading || paymentsQuery.isLoading) {
    return <LoadingState />;
  }

  if (!user) return null;

  if (billingQuery.isError || plansQuery.isError || paymentsQuery.isError) {
    const error = billingQuery.error ?? plansQuery.error ?? paymentsQuery.error;
    return (
      <ErrorState message={error instanceof Error ? error.message : "Unable to load billing."} />
    );
  }

  const billing = billingQuery.data?.data;
  const plans = plansQuery.data?.data ?? [];
  const payments = paymentsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Billing
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Plans and AI usage
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage AI tutor capacity and checkout attempts. Paid plans activate only after a
                verified payment webhook confirms the checkout.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={interval === "MONTHLY" ? "primary" : "secondary"}
                onClick={() => setInterval("MONTHLY")}
              >
                Monthly
              </Button>
              <Button
                variant={interval === "YEARLY" ? "primary" : "secondary"}
                onClick={() => setInterval("YEARLY")}
              >
                Yearly
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.75fr_0.45fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Current plan
                  </p>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {billing?.currentPlan.name ?? "Free"}
                  </h2>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AIUsageMeter usage={billing?.aiUsage} />
              {checkoutMessage ? (
                <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {checkoutMessage}
                </p>
              ) : null}
              {subscribeMutation.isError ? (
                <p className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {subscribeMutation.error instanceof Error
                    ? subscribeMutation.error.message
                    : "Unable to create checkout."}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Checkout gateway
              </p>
              <h2 className="text-xl font-semibold text-slate-950">Upgrade checkout</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant={gateway === "stripe" ? "primary" : "secondary"}
                onClick={() => setGateway("stripe")}
              >
                Stripe
              </Button>
              <Button
                className="w-full"
                variant={gateway === "razorpay" ? "primary" : "secondary"}
                onClick={() => setGateway("razorpay")}
              >
                Razorpay
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              interval={interval}
              isCurrent={billing?.currentPlan.code === plan.code}
              isPending={subscribeMutation.isPending}
              onUpgrade={(planCode) => subscribeMutation.mutate(planCode)}
              plan={plan}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Payments
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Payment history</h2>
          </div>

          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <ReceiptText className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-xl font-semibold text-slate-950">No payments yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pending and completed course or subscription payments will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {payment.gateway} · {payment.status}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {payment.course?.title ?? "Subscription checkout"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">
                      {(payment.amount / 100).toFixed(2)} {payment.currency}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
