"use client";

import { useEffect, useState } from "react";
import { Send, Wallet } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import {
  createPayoutRequest,
  getCreatorRevenue,
  getPayoutProfile,
  getPayoutRequests,
  updatePayoutProfile,
  type MoneyAmount,
  type PayoutMethod,
  type UpsertPayoutProfileInput,
} from "@/services/creator-revenue.api";

function formatMoney(money: MoneyAmount) {
  return new Intl.NumberFormat("en-IN", {
    currency: money.currency,
    style: "currency",
  }).format(money.amount / 100);
}

const payoutMethods: PayoutMethod[] = ["BANK", "UPI", "PAYPAL"];

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function CreatorPayoutsPage() {
  const queryClient = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("India");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("UPI");
  const [bankName, setBankName] = useState("");
  const [accountLast4, setAccountLast4] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [requestAmount, setRequestAmount] = useState("");

  const revenueQuery = useQuery({
    queryKey: ["creatorRevenue"],
    queryFn: getCreatorRevenue,
  });
  const profileQuery = useQuery({
    queryKey: ["payoutProfile"],
    queryFn: getPayoutProfile,
  });
  const requestsQuery = useQuery({
    queryKey: ["payoutRequests"],
    queryFn: getPayoutRequests,
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    setLegalName(profileQuery.data.legalName);
    setCountry(profileQuery.data.country);
    setPayoutMethod(profileQuery.data.payoutMethod);
    setBankName(profileQuery.data.bankName ?? "");
    setAccountLast4(profileQuery.data.accountLast4 ?? "");
    setUpiId(profileQuery.data.upiId ?? "");
    setPaypalEmail(profileQuery.data.paypalEmail ?? "");
  }, [profileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: updatePayoutProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payoutProfile"] }),
  });

  const requestMutation = useMutation({
    mutationFn: createPayoutRequest,
    onSuccess: () => {
      setRequestAmount("");
      void queryClient.invalidateQueries({ queryKey: ["payoutRequests"] });
      void queryClient.invalidateQueries({ queryKey: ["creatorRevenue"] });
    },
  });

  if (revenueQuery.isLoading || profileQuery.isLoading || requestsQuery.isLoading) {
    return <LoadingState />;
  }

  if (revenueQuery.isError || profileQuery.isError || requestsQuery.isError) {
    const error = revenueQuery.error ?? profileQuery.error ?? requestsQuery.error;
    return (
      <ErrorState message={error instanceof Error ? error.message : "Unable to load payouts."} />
    );
  }

  const revenue = revenueQuery.data;
  const requests = requestsQuery.data ?? [];
  const available = revenue?.pendingRevenue ?? { amount: 0, currency: "INR" };
  const amountInMinorUnits = Math.round(Number(requestAmount || 0) * 100);
  const canRequest = amountInMinorUnits > 0 && amountInMinorUnits <= available.amount;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Creator payouts
        </p>
        <div className="mt-4 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Request review for unpaid earnings
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Payout requests are reviewed by admins. No bank transfer, wallet transfer, or payout
            automation is triggered from this page.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-950">Payout profile</h3>
            </div>
            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const payload = {
                  ...(optionalString(accountLast4) ? { accountLast4: accountLast4.trim() } : {}),
                  ...(optionalString(bankName) ? { bankName: bankName.trim() } : {}),
                  country,
                  legalName,
                  ...(optionalString(paypalEmail) ? { paypalEmail: paypalEmail.trim() } : {}),
                  payoutMethod,
                  ...(optionalString(upiId) ? { upiId: upiId.trim() } : {}),
                } satisfies UpsertPayoutProfileInput;

                profileMutation.mutate(payload);
              }}
            >
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Legal name
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setLegalName(event.target.value)}
                  required
                  value={legalName}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Country
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setCountry(event.target.value)}
                  required
                  value={country}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Payout method
                <select
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setPayoutMethod(event.target.value as PayoutMethod)}
                  value={payoutMethod}
                >
                  {payoutMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Bank name
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setBankName(event.target.value)}
                  value={bankName}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Account last 4
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) => setAccountLast4(event.target.value)}
                  value={accountLast4}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                UPI ID
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setUpiId(event.target.value)}
                  value={upiId}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                PayPal email
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(event) => setPaypalEmail(event.target.value)}
                  type="email"
                  value={paypalEmail}
                />
              </label>
              <div className="md:col-span-2">
                <Button disabled={profileMutation.isPending} type="submit">
                  Save payout profile
                </Button>
                {profileMutation.isError ? (
                  <p className="mt-3 text-sm text-red-600">
                    {profileMutation.error instanceof Error
                      ? profileMutation.error.message
                      : "Unable to save payout profile."}
                  </p>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Available balance
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{formatMoney(available)}</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                requestMutation.mutate({
                  amount: amountInMinorUnits,
                  currency: available.currency,
                });
              }}
            >
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Request amount
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                  min="0"
                  onChange={(event) => setRequestAmount(event.target.value)}
                  step="0.01"
                  type="number"
                  value={requestAmount}
                />
              </label>
              <Button disabled={!canRequest || requestMutation.isPending} type="submit">
                <Send aria-hidden className="h-4 w-4" />
                Request payout
              </Button>
              {requestMutation.isError ? (
                <p className="text-sm text-red-600">
                  {requestMutation.error instanceof Error
                    ? requestMutation.error.message
                    : "Unable to create payout request."}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Payout requests</h3>
          {requests.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              No payout requests yet. Requests you submit will appear here with review status.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              {requests.map((request) => (
                <div
                  className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
                  key={request.id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {formatMoney({ amount: request.amount, currency: request.currency })}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{request.notes}</p>
                    ) : null}
                  </div>
                  <span className="h-fit rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
