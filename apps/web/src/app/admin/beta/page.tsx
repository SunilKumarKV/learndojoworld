"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Ticket,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import {
  adminBetaApi,
  type BetaAccessStatus,
  type FeedbackStatus,
  type SupportRequestStatus,
} from "@/services/beta.api";

const accessStatuses: BetaAccessStatus[] = ["INVITED", "ACCEPTED", "REVOKED"];
const feedbackStatuses: FeedbackStatus[] = ["OPEN", "REVIEWED", "CLOSED"];
const supportStatuses: SupportRequestStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function AdminBetaPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const dashboard = useQuery({
    queryKey: ["admin", "beta", "dashboard"],
    queryFn: adminBetaApi.getDashboard,
  });
  const access = useQuery({
    queryKey: ["admin", "beta", "access"],
    queryFn: adminBetaApi.listAccess,
  });
  const feedback = useQuery({
    queryKey: ["admin", "beta", "feedback"],
    queryFn: adminBetaApi.listFeedback,
  });
  const support = useQuery({
    queryKey: ["admin", "beta", "support"],
    queryFn: adminBetaApi.listSupport,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "beta"] });
  };

  const createAccess = useMutation({
    mutationFn: adminBetaApi.createAccess,
    onSuccess: () => {
      setEmail("");
      setNotes("");
      invalidate();
    },
  });
  const updateAccess = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BetaAccessStatus }) =>
      adminBetaApi.updateAccess(id, { status }),
    onSuccess: invalidate,
  });
  const updateFeedback = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      adminBetaApi.updateFeedback(id, { status }),
    onSuccess: invalidate,
  });
  const updateSupport = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportRequestStatus }) =>
      adminBetaApi.updateSupport(id, { status }),
    onSuccess: invalidate,
  });

  if (dashboard.isLoading || access.isLoading || feedback.isLoading || support.isLoading) {
    return <LoadingState />;
  }

  if (dashboard.isError || access.isError || feedback.isError || support.isError) {
    return <ErrorState message="Unable to load beta operations." />;
  }

  const metrics = dashboard.data;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Controlled beta
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Beta operations dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage invited users, review beta feedback, and watch launch-readiness signals for the
          first 50-100 real users.
        </p>
      </section>

      {metrics && (
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard icon={UserPlus} label="Beta users" value={metrics.beta.totalBetaUsers} />
          <MetricCard icon={Clock} label="Active 7d" value={metrics.beta.activeBetaUsers} />
          <MetricCard icon={MessageSquare} label="Open feedback" value={metrics.feedback.open} />
          <MetricCard icon={Ticket} label="Open tickets" value={metrics.support.open} />
          <MetricCard label="AI messages today" value={metrics.product.aiMessagesToday} />
          <MetricCard label="Enrollments" value={metrics.product.enrollments} />
          <MetricCard label="Creator applications" value={metrics.product.creatorApplications} />
          <MetricCard
            label="Onboarding completion"
            value={`${metrics.funnel.onboardingCompletionRate}%`}
          />
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          {createAccess.isError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {createAccess.error instanceof Error
                ? createAccess.error.message
                : "Unable to invite beta user."}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              className="h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm"
              placeholder="learner@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm"
              placeholder="Invite notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Button
              disabled={!email.trim() || createAccess.isPending}
              onClick={() =>
                createAccess.mutate({
                  email: email.trim(),
                  ...(notes.trim() ? { notes: notes.trim() } : {}),
                })
              }
            >
              <UserPlus className="h-4 w-4" />
              {createAccess.isPending ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {updateAccess.isError || updateFeedback.isError || updateSupport.isError ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {(updateAccess.error ?? updateFeedback.error ?? updateSupport.error) instanceof Error
            ? (updateAccess.error ?? updateFeedback.error ?? updateSupport.error)?.message
            : "Unable to update beta operations item."}
        </p>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <OpsList title="Beta access">
          {(access.data ?? []).length === 0 ? (
            <EmptyOpsMessage message="No beta access records yet." />
          ) : (
            (access.data ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.email}</p>
                <p className="text-xs text-slate-500">
                  {item.user?.username ?? "No linked user yet"}
                </p>
                <StatusSelect
                  disabled={updateAccess.isPending}
                  value={item.status}
                  values={accessStatuses}
                  onChange={(status) => updateAccess.mutate({ id: item.id, status })}
                />
              </div>
            ))
          )}
        </OpsList>

        <OpsList title="Feedback">
          {(feedback.data ?? []).length === 0 ? (
            <EmptyOpsMessage message="No feedback has been submitted yet." />
          ) : (
            (feedback.data ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-primary">{item.type}</p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-700">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{item.user?.email}</p>
                <StatusSelect
                  disabled={updateFeedback.isPending}
                  value={item.status}
                  values={feedbackStatuses}
                  onChange={(status) => updateFeedback.mutate({ id: item.id, status })}
                />
              </div>
            ))
          )}
        </OpsList>

        <OpsList title="Support">
          {(support.data ?? []).length === 0 ? (
            <EmptyOpsMessage message="No support tickets are open yet." />
          ) : (
            (support.data ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.subject}</p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-700">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{item.user?.email}</p>
                <StatusSelect
                  disabled={updateSupport.isPending}
                  value={item.status}
                  values={supportStatuses}
                  onChange={(status) => updateSupport.mutate({ id: item.id, status })}
                />
              </div>
            ))
          )}
        </OpsList>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon = CheckCircle2,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function OpsList({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <div className="max-h-[560px] space-y-3 overflow-y-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

function EmptyOpsMessage({ message }: { message: string }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{message}</p>;
}

function StatusSelect<TValue extends string>({
  disabled = false,
  onChange,
  value,
  values,
}: {
  disabled?: boolean;
  onChange: (value: TValue) => void;
  value: TValue;
  values: TValue[];
}) {
  return (
    <select
      className="mt-3 h-9 w-full rounded-md border border-slate-300 px-2 text-xs font-semibold"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value as TValue)}
    >
      {values.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}
