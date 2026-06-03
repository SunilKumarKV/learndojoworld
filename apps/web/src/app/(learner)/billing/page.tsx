"use client";

import { CreditCard, ReceiptText } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { useSession } from "@/hooks/use-session";
import { getMyPayments } from "@/services/payments.api";

export default function BillingPage() {
  const router = useRouter();
  const { isLoading: sessionLoading, user } = useSession();
  const {
    data: payments = [],
    error,
    isError,
    isLoading,
  } = useQuery({
    enabled: Boolean(user),
    queryFn: getMyPayments,
    queryKey: ["payments", "me"],
  });

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace("/login?next=/billing");
    }
  }, [router, sessionLoading, user]);

  if (sessionLoading || isLoading) return <LoadingState />;
  if (!user) return null;
  if (isError) {
    return (
      <ErrorState message={error instanceof Error ? error.message : "Unable to load billing."} />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Billing</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Payment history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Course payments and checkout attempts appear here. Subscriptions, invoices, refunds, and
            creator payouts are not enabled yet.
          </p>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Monetization
                </p>
                <h2 className="text-xl font-semibold text-slate-950">Checkout foundation</h2>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">
              Paid course checkout can create pending payments. Access is unlocked only after a
              verified payment webhook marks the payment successful.
            </p>
          </CardContent>
        </Card>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <ReceiptText className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-semibold text-slate-950">No payments yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pending and completed course payments will show up here.
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
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                      {payment.course?.title ?? "Course payment"}
                    </h2>
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
      </div>
    </main>
  );
}
