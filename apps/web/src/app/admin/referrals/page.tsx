"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/admin.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { Check, X, Gift, Clock } from "lucide-react";

export default function AdminReferralsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"REWARDS" | "EVENTS">("REWARDS");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: adminApi.getReferrals,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveReferralReward,
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectReferralReward(id, reason),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      void invalidate();
    },
  });

  const grantMutation = useMutation({
    mutationFn: adminApi.grantReferralReward,
    onSuccess: invalidate,
  });
  const actionError = approveMutation.error ?? rejectMutation.error ?? grantMutation.error;
  const actionPending =
    approveMutation.isPending || rejectMutation.isPending || grantMutation.isPending;

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load admin referrals." />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Referral Engine Admin</h1>
        <p className="text-muted-foreground mt-2">
          Manage referral events and approve user rewards.
        </p>
      </div>

      <div className="flex gap-4 border-b pb-2">
        <Button
          variant={activeTab === "REWARDS" ? "primary" : "ghost"}
          onClick={() => setActiveTab("REWARDS")}
        >
          Reward Requests ({data.rewards.length})
        </Button>
        <Button
          variant={activeTab === "EVENTS" ? "primary" : "ghost"}
          onClick={() => setActiveTab("EVENTS")}
        >
          Referral Events ({data.events.length})
        </Button>
      </div>

      {approveMutation.isError || rejectMutation.isError || grantMutation.isError ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError instanceof Error ? actionError.message : "Unable to update referral reward."}
        </p>
      ) : null}

      {activeTab === "REWARDS" && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Connection</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rewards.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-sm text-muted-foreground" colSpan={5}>
                      No referral reward requests yet.
                    </td>
                  </tr>
                ) : (
                  data.rewards.map((reward) => (
                    <tr key={reward.id} className="border-b last:border-0">
                      <td className="px-4 py-4">
                        <p className="font-medium">{reward.user.name}</p>
                        <p className="text-xs text-muted-foreground">{reward.user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{reward.rewardValue} Days</p>
                        <p className="text-xs text-muted-foreground">{reward.rewardType}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        Inviter: {reward.referralEvent.inviter.name}
                        <br />
                        Invited: {reward.referralEvent.invited.name}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            reward.status === "GRANTED"
                              ? "bg-green-100 text-green-700"
                              : reward.status === "APPROVED"
                                ? "bg-blue-100 text-blue-700"
                                : reward.status === "PENDING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                        >
                          {reward.status}
                        </span>
                        {reward.notes && (
                          <p
                            className="text-xs text-muted-foreground mt-1 max-w-[180px] truncate"
                            title={reward.notes}
                          >
                            Note: {reward.notes}
                          </p>
                        )}
                        {reward.fulfilledAt && (
                          <p className="text-xs text-green-700 mt-1">
                            Fulfilled {new Date(reward.fulfilledAt).toLocaleDateString()}
                          </p>
                        )}
                        {reward.fulfillmentReference && (
                          <p
                            className="text-xs text-muted-foreground mt-1 max-w-[180px] truncate"
                            title={reward.fulfillmentReference}
                          >
                            Ref: {reward.fulfillmentReference}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {rejectingId === reward.id ? (
                          <div className="flex flex-col gap-2 items-end">
                            <input
                              type="text"
                              placeholder="Reason for rejection..."
                              className="text-xs border px-2 py-1 rounded w-48"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionPending}
                                onClick={() => setRejectingId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={!rejectReason.trim() || actionPending}
                                onClick={() =>
                                  rejectMutation.mutate({
                                    id: reward.id,
                                    reason: rejectReason.trim(),
                                  })
                                }
                              >
                                {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {reward.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={actionPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => approveMutation.mutate(reward.id)}
                                >
                                  <Check className="w-4 h-4 mr-1" />{" "}
                                  {approveMutation.isPending ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={actionPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setRejectingId(reward.id)}
                                >
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {reward.status === "APPROVED" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={actionPending}
                                  onClick={() => grantMutation.mutate(reward.id)}
                                >
                                  <Gift className="w-4 h-4 mr-1" />{" "}
                                  {grantMutation.isPending ? "Granting..." : "Grant Pro"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={actionPending}
                                  className="text-red-600"
                                  onClick={() => setRejectingId(reward.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {(reward.status === "GRANTED" || reward.status === "REJECTED") && (
                              <span className="text-xs text-muted-foreground flex items-center justify-end">
                                <Clock className="w-3 h-3 mr-1" /> Finalized
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "EVENTS" && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Code Used</th>
                  <th className="px-4 py-3">Inviter</th>
                  <th className="px-4 py-3">Invited (New User)</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.events.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-sm text-muted-foreground" colSpan={5}>
                      No referral events have been recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">{event.referralCode.code}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{event.inviter.name}</p>
                        <p className="text-xs text-muted-foreground">{event.inviter.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{event.invited.name}</p>
                        <p className="text-xs text-muted-foreground">{event.invited.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
