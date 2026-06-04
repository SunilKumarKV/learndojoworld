"use client";

import { useQuery } from "@tanstack/react-query";
import { referralsApi } from "@/services/referrals.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

export function DashboardReferralCard() {
  const { data: me } = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: referralsApi.getMe,
  });

  if (!me) return null;

  return (
    <Card className="p-5 flex flex-col justify-between h-full bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Invite & Earn
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have <strong className="text-foreground">{me.successfulReferrals}</strong>{" "}
            successful invites.
          </p>
        </div>
      </div>
      <Button variant="secondary" className="w-full justify-between group" asChild>
        <Link href="/referrals">
          View Referrals
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md group-hover:bg-primary/90 transition-colors">
            {me.referralCode}
          </span>
        </Link>
      </Button>
    </Card>
  );
}
