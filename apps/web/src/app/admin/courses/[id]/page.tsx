"use client";
/* eslint-disable @typescript-eslint/no-floating-promises */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import {
  approveCourse,
  getAdminCourseReview,
  rejectCourse,
  type AdminCourseReview,
} from "@/services/admin.api";

export default function AdminCourseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [rejectReason, setRejectReason] = useState("");

  const { data, error, isError, isLoading } = useQuery<AdminCourseReview>({
    queryKey: ["adminCourseReview", courseId],
    queryFn: async () => await getAdminCourseReview(courseId ?? ""),
    enabled: Boolean(courseId),
  });

  const approveMutation = useMutation({
    mutationFn: async () => await approveCourse(courseId ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingCourses"] });
      void router.push("/admin/courses");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => await rejectCourse(courseId ?? "", rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingCourses"] });
      void router.push("/admin/courses");
    },
  });

  const isPending = data?.status === "PENDING_REVIEW";
  const hasActionError = error instanceof Error ? error.message : "Unable to load course review.";
  const isBusy = approveMutation.status === "pending" || rejectMutation.status === "pending";

  const metadataEntries = useMemo(() => {
    return (
      data?.auditLogs.map((log) => ({
        label: log.action.replace(/_/g, " "),
        value: log.metadata ? JSON.stringify(log.metadata) : "No metadata",
        date: new Date(log.createdAt).toLocaleString(),
      })) ?? []
    );
  }, [data?.auditLogs]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return <ErrorState message={hasActionError} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Course review
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {data.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review this course submission and take action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void router.push("/admin/courses")}>
              Back to queue
            </Button>
            <Button onClick={() => void router.push("/admin")}>Dashboard</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Creator</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {data.creator?.name ?? data.creator?.username ?? "Unknown"}
                    </p>
                    <p className="text-sm text-slate-600">{data.creator?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{data.status}</p>
                    <p className="text-sm text-slate-600">
                      Updated {new Date(data.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Description</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{data.description}</p>
                </div>
                <div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Category</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {data.category?.name ?? "Uncategorized"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Difficulty
                      </p>
                      <p className="mt-2 text-sm text-slate-700">{data.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Language</p>
                      <p className="mt-2 text-sm text-slate-700">{data.language}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-950">Course curriculum</h3>
                {data.modules.map((module) => (
                  <div key={module.id} className="rounded-3xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{module.title}</p>
                    <p className="text-sm text-slate-500">{module.lessons.length} lessons</p>
                    <div className="mt-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="rounded-2xl bg-slate-50 p-3">
                          <p className="font-medium text-slate-900">{lesson.title}</p>
                          <p className="text-sm text-slate-600">{lesson.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Actions</p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => void approveMutation.mutate()}
                    disabled={!isPending || isBusy}
                  >
                    {approveMutation.status === "pending" ? "Approving…" : "Approve course"}
                  </Button>
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="rejectReason"
                  >
                    Reject reason
                  </label>
                  <textarea
                    id="rejectReason"
                    className="mt-2 min-h-[130px] w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Explain why the course was rejected"
                  />
                  <Button
                    className="mt-3"
                    variant="secondary"
                    disabled={!isPending || isBusy || rejectReason.trim().length === 0}
                    onClick={() => void rejectMutation.mutate()}
                  >
                    {rejectMutation.status === "pending" ? "Rejecting…" : "Reject course"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Audit log</p>
                {metadataEntries.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No moderation actions have been recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {metadataEntries.map((entry) => (
                      <div
                        key={`${entry.label}-${entry.date}`}
                        className="rounded-3xl bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {entry.date}
                        </p>
                        <p className="mt-3 text-sm text-slate-600 break-words">{entry.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
