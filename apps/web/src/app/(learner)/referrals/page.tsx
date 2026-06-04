"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { referralsApi } from "@/services/referrals.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, Users, Clock } from "lucide-react";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { ErrorState } from "@/features/dashboard/components/error-state";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyError, setApplyError] = useState("");

  const {
    data: me,
    isLoading: loadingMe,
    error: errorMe,
  } = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: referralsApi.getMe,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: referralsApi.getStats,
  });

  const applyMutation = useMutation({
    mutationFn: referralsApi.applyCode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
      setApplyCode("");
      setApplyError("");
      alert("Referral code applied successfully!");
    },
    onError: (error: unknown) => {
      const err = error as ApiError;
      setApplyError(err?.response?.data?.message || "Failed to apply referral code.");
    },
  });

  const handleCopy = async () => {
    if (me?.referralLink) {
      await navigator.clipboard.writeText(me.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCode.trim()) return;
    applyMutation.mutate(applyCode.trim());
  };

  if (loadingMe || loadingStats) return <LoadingState />;
  if (errorMe || !me) return <ErrorState message="Failed to load referrals." />;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referrals & Rewards</h1>
        <p className="text-muted-foreground mt-2">
          Invite friends to LearnDojoWorld and earn rewards when they start learning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 space-y-4 bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              readOnly
              value={me.referralLink}
              className="flex-1 px-4 py-2 bg-background border rounded-md text-sm font-medium focus:outline-none"
            />
            <Button onClick={() => void handleCopy()} className="min-w-[120px]">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link or your code{" "}
            <strong className="text-foreground">{me.referralCode}</strong> with friends.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Been Invited?</h2>
          <form onSubmit={handleApplySubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Enter referral code"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
              maxLength={8}
            />
            {applyError && <p className="text-xs text-destructive">{applyError}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={applyMutation.isPending || !applyCode.trim()}
            >
              {applyMutation.isPending ? "Applying..." : "Apply Code"}
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Invites</p>
            <p className="text-2xl font-bold">{me.totalInvites}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Successful</p>
            <p className="text-2xl font-bold">{me.successfulReferrals}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Pending</p>
            <p className="text-2xl font-bold">{me.pendingReferrals}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Referrals</h2>
        {!stats?.recentEvents || stats.recentEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center bg-muted/20 rounded-lg">
            You haven't referred anyone yet. Share your link to get started!
          </p>
        ) : (
          <div className="divide-y">
            {stats.recentEvents.map((event) => (
              <div key={event.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{event.invitedUser}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : event.status === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
