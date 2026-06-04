"use client";

import { BookOpen, IndianRupee, ReceiptText, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { getCreatorRevenue, type MoneyAmount } from "@/services/creator-revenue.api";

function formatMoney(money: MoneyAmount) {
  return new Intl.NumberFormat("en-IN", {
    currency: money.currency,
    style: "currency",
  }).format(money.amount / 100);
}

export default function CreatorRevenuePage() {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["creatorRevenue"],
    queryFn: getCreatorRevenue,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load creator revenue."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Creator revenue
        </p>
        <div className="mt-4 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Earnings from verified paid enrollments
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revenue appears only after a payment webhook is verified and the learner enrollment is
            unlocked. Payout requests reserve available unpaid earnings until reviewed.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <IndianRupee className="h-5 w-5 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total revenue
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(data.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <ReceiptText className="h-5 w-5 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Available
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(data.pendingRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <IndianRupee className="h-5 w-5 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Paid out
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {formatMoney(data.paidRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Users className="h-5 w-5 text-primary" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Learners
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{data.totalEnrollments}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-950">Top courses</h3>
            </div>
            {data.topCourses.length === 0 ? (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                No paid course earnings yet. Paid enrollments will appear here after verified
                checkout webhooks.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.topCourses.map((item) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
                    key={item.course.id}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{item.course.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.salesCount} paid sales</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatMoney({ amount: item.creatorAmount, currency: item.currency })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-950">Recent earnings</h3>
            {data.recentEarnings.length === 0 ? (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Earnings will be recorded here when a paid course purchase is verified.
              </p>
            ) : (
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                {data.recentEarnings.map((earning) => (
                  <div
                    className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
                    key={earning.id}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{earning.course.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-slate-950">
                        {formatMoney({
                          amount: earning.creatorAmount,
                          currency: earning.currency,
                        })}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">70% creator share</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
