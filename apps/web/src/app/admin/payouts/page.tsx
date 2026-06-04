"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import {
  approveAdminPayoutRequest,
  getAdminPayoutRequests,
  rejectAdminPayoutRequest,
} from "@/services/admin-payouts.api";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    currency,
    style: "currency",
  }).format(amount / 100);
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [rejectNotesById, setRejectNotesById] = useState<Record<string, string>>({});
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["adminPayoutRequests"],
    queryFn: getAdminPayoutRequests,
  });

  const approveMutation = useMutation({
    mutationFn: approveAdminPayoutRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPayoutRequests"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      rejectAdminPayoutRequest(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminPayoutRequests"] }),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load payout requests."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Payout review
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Creator payout requests
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Approving a request records admin review only. It does not initiate a bank, UPI, PayPal,
          or wallet transfer.
        </p>
      </section>

      {data.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-lg font-semibold text-slate-950">No payout requests</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Creator payout requests will appear here after verified course earnings exist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((request) => {
            const creatorName =
              request.creator.displayName ??
              request.creator.user.name ??
              request.creator.user.username ??
              request.creator.user.email;
            const notes = rejectNotesById[request.id] ?? "";
            const isPending = request.status === "PENDING";

            return (
              <Card key={request.id}>
                <CardContent className="grid gap-5 p-6 xl:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-2xl font-semibold text-slate-950">
                        {formatMoney(request.amount, request.currency)}
                      </p>
                      <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Requested by{" "}
                      <span className="font-semibold text-slate-950">{creatorName}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.creator.user.email} ·{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.creator.payoutProfile ? (
                      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>Legal name: {request.creator.payoutProfile.legalName}</p>
                        <p>Country: {request.creator.payoutProfile.country}</p>
                        <p>Method: {request.creator.payoutProfile.payoutMethod}</p>
                        <p>
                          Account:{" "}
                          {request.creator.payoutProfile.accountLast4
                            ? `****${request.creator.payoutProfile.accountLast4}`
                            : (request.creator.payoutProfile.upiId ??
                              request.creator.payoutProfile.paypalEmail ??
                              "Not provided")}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-amber-700">
                        This creator has not saved a payout profile.
                      </p>
                    )}
                    {request.notes ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">{request.notes}</p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      disabled={!isPending || approveMutation.isPending}
                      onClick={() => approveMutation.mutate(request.id)}
                    >
                      <CheckCircle2 aria-hidden className="h-4 w-4" />
                      Approve
                    </Button>
                    <textarea
                      className="min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm"
                      disabled={!isPending}
                      onChange={(event) =>
                        setRejectNotesById((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="Rejection notes"
                      value={notes}
                    />
                    <Button
                      className="w-full"
                      disabled={!isPending || notes.trim().length === 0 || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ id: request.id, notes: notes.trim() })}
                      variant="secondary"
                    >
                      <XCircle aria-hidden className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {approveMutation.isError || rejectMutation.isError ? (
        <p className="text-sm text-red-600">
          {(approveMutation.error ?? rejectMutation.error) instanceof Error
            ? (approveMutation.error ?? rejectMutation.error)?.message
            : "Unable to update payout request."}
        </p>
      ) : null}
    </div>
  );
}
