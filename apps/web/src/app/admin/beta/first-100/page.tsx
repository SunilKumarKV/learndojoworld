"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, MailPlus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { adminBetaApi } from "@/services/beta.api";

export default function AdminFirst100Page() {
  const queryClient = useQueryClient();
  const [cohortName, setCohortName] = useState("");
  const [cohortDescription, setCohortDescription] = useState("");
  const [targetUsers, setTargetUsers] = useState(50);

  const dashboard = useQuery({
    queryKey: ["admin", "beta", "first-100"],
    queryFn: adminBetaApi.getFirst100Dashboard,
  });
  const waitlist = useQuery({
    queryKey: ["admin", "beta", "waitlist"],
    queryFn: adminBetaApi.listWaitlist,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "beta"] });
  };

  const invite = useMutation({
    mutationFn: adminBetaApi.inviteWaitlist,
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: adminBetaApi.rejectWaitlist,
    onSuccess: invalidate,
  });
  const createCohort = useMutation({
    mutationFn: adminBetaApi.createCohort,
    onSuccess: () => {
      setCohortName("");
      setCohortDescription("");
      setTargetUsers(50);
      invalidate();
    },
  });

  if (dashboard.isLoading || waitlist.isLoading) {
    return <LoadingState />;
  }

  if (dashboard.isError || waitlist.isError || !dashboard.data) {
    return <ErrorState message="Unable to load first-100 dashboard." />;
  }

  const data = dashboard.data;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Founder-led growth
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          First 100 users
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Manage waitlist conversion, invite flow, cohort planning, and first-session activation
          signals for controlled beta growth.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <Metric label="Waitlisted" value={data.waitlist.waitlisted} />
        <Metric label="Invited" value={data.invites.invited} />
        <Metric label="Accepted" value={data.invites.accepted} />
        <Metric label="Onboarding" value={`${data.rates.onboardingCompletionRate}%`} />
        <Metric label="First enrollment" value={`${data.rates.firstCourseEnrollmentRate}%`} />
        <Metric label="First lesson" value={`${data.rates.firstLessonCompletionRate}%`} />
        <Metric label="First AI" value={`${data.rates.firstAIMessageRate}%`} />
        <Metric label="Creator applications" value={data.activation.creatorApplications} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <MailPlus className="h-5 w-5 text-primary" />
              Waitlist
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {(waitlist.data ?? []).length === 0 ? (
              <p className="text-sm text-slate-600">No waitlist entries yet.</p>
            ) : (
              (waitlist.data ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{entry.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.name ?? "No name"} · {entry.roleInterest} · {entry.status}
                    </p>
                    {entry.source && <p className="mt-1 text-xs text-slate-500">{entry.source}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={invite.isPending || entry.status === "ACCEPTED"}
                      size="sm"
                      onClick={() => invite.mutate(entry.id)}
                    >
                      Invite
                    </Button>
                    <Button
                      disabled={reject.isPending || entry.status === "ACCEPTED"}
                      size="sm"
                      variant="secondary"
                      onClick={() => reject.mutate(entry.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
              <UsersRound className="h-5 w-5 text-primary" />
              Cohorts
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Cohort name"
                value={cohortName}
                onChange={(event) => setCohortName(event.target.value)}
              />
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Description"
                value={cohortDescription}
                onChange={(event) => setCohortDescription(event.target.value)}
              />
              <input
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                min={1}
                type="number"
                value={targetUsers}
                onChange={(event) => setTargetUsers(Number(event.target.value))}
              />
              <Button
                disabled={!cohortName || createCohort.isPending}
                onClick={() =>
                  createCohort.mutate({
                    name: cohortName,
                    targetUsers,
                    ...(cohortDescription.trim() ? { description: cohortDescription.trim() } : {}),
                  })
                }
              >
                Create cohort
              </Button>
            </div>
            <div className="space-y-2">
              {data.cohorts.map((cohort) => (
                <div key={cohort.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-950">{cohort.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {cohort._count?.betaAccess ?? 0}/{cohort.targetUsers} users
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-950">Beta user progress</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="py-3">User</th>
                <th>Onboarding</th>
                <th>Enrollment</th>
                <th>Lesson</th>
                <th>AI</th>
                <th>Feedback</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.betaUserProgress.map((user) => (
                <tr key={user.betaAccessId}>
                  <td className="py-3">
                    <p className="font-semibold text-slate-950">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.cohort?.name ?? "No cohort"}</p>
                  </td>
                  <td>{statusIcon(user.onboardingCompleted)}</td>
                  <td>{statusIcon(user.firstCourseEnrollment)}</td>
                  <td>{statusIcon(user.firstLessonCompleted)}</td>
                  <td>{statusIcon(user.firstAIMessage)}</td>
                  <td>{user.feedbackSubmitted}</td>
                  <td>{user.supportRequests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function statusIcon(done: boolean) {
  return done ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  ) : (
    <Circle className="h-5 w-5 text-slate-300" />
  );
}
