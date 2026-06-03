"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCourseDetail } from "@/features/courses/hooks/use-course-detail";
import { useEnrollCourse } from "@/features/learning/hooks/use-my-learning";
import { getEnrollmentStatus } from "@/services/enrollment.api";
import { createCheckoutSession } from "@/services/payments.api";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { data: course, isLoading, isError, error } = useCourseDetail(slug);
  const { mutate: enroll, isPending } = useEnrollCourse();
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const checkoutMutation = useMutation({
    mutationFn: async (gateway: "stripe" | "razorpay") => {
      return createCheckoutSession(course!.id, gateway);
    },
    onSuccess: (session) => {
      setCheckoutMessage("");
      if (session.gateway === "stripe" && session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else if (session.gateway === "razorpay") {
        setCheckoutMessage(
          session.providerConfigured
            ? "Razorpay order created. Checkout widget integration is ready for the next frontend step."
            : "Pending payment created. Razorpay keys are not configured locally.",
        );
      } else {
        setCheckoutMessage("Pending payment created. Stripe keys are not configured locally.");
      }
    },
    onError: (checkoutError) => {
      setCheckoutMessage(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.",
      );
    },
  });

  const { data: enrollmentStatus } = useQuery({
    enabled: Boolean(course?.id),
    queryFn: async () => {
      const response = await getEnrollmentStatus(course!.id);
      if (!response.success)
        throw new Error(response.message || "Unable to load enrollment state.");
      return response.data;
    },
    queryKey: ["enrollment-status", course?.id],
  });

  if (isLoading)
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-700">Loading course details…</main>
    );
  if (isError)
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-red-700">
        {error instanceof Error ? error.message : "Course could not be loaded."}
      </main>
    );
  if (!course) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-8">
          <Card className="overflow-hidden border-none shadow-soft-xl">
            <CardHeader className="bg-gradient-to-r from-primary/8 to-slate-100 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Course detail
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{course.subtitle ?? course.description}</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{course.difficulty}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{course.language}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {course.category?.name ?? "General"}
                </span>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-700">{course.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Curriculum</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Module {module.order}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{lesson.title}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {lesson.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.isPreview ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                                Preview
                              </span>
                            ) : null}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                router.push(`/course/${course.slug}/lesson/${lesson.id}`)
                              }
                            >
                              Open lesson
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Start learning</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.isFree ? (
                <>
                  <p className="text-sm text-slate-600">
                    This is a free course. Enroll immediately to start learning.
                  </p>
                  <Button
                    className="w-full"
                    disabled={isPending || enrollmentStatus?.enrolled}
                    onClick={() => enroll(course.id)}
                  >
                    {enrollmentStatus?.enrolled ? "Already enrolled" : "Enroll for free"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-slate-100 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Price</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {formatCoursePrice(course.price, course.currency)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    Unlock full access to all lessons and materials.
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      disabled={checkoutMutation.status === "pending" || enrollmentStatus?.enrolled}
                      onClick={() => checkoutMutation.mutate("stripe")}
                    >
                      {enrollmentStatus?.enrolled ? "Already enrolled" : "Pay with Stripe"}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      disabled={checkoutMutation.status === "pending" || enrollmentStatus?.enrolled}
                      onClick={() => checkoutMutation.mutate("razorpay")}
                    >
                      Pay with Razorpay
                    </Button>
                  </div>
                  {checkoutMessage ? (
                    <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                      {checkoutMessage}
                    </p>
                  ) : null}
                </>
              )}
              <p className="text-xs text-slate-500">
                Status: {enrollmentStatus?.enrolled ? "You are enrolled" : "Not enrolled yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">AI Tutor</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Ask the LearnDojoWorld Tutor for help using your course context.
              </p>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() =>
                  window.location.assign(`/ai?courseId=${course.id}&courseSlug=${course.slug}`)
                }
              >
                Ask AI Tutor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Course snapshot</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Difficulty: {course.difficulty}</p>
              <p>Language: {course.language}</p>
              <p>
                Price: {course.isFree ? "Free" : formatCoursePrice(course.price, course.currency)}
              </p>
              <p>
                Preview lessons:{" "}
                {
                  course.modules
                    .flatMap((module) => module.lessons)
                    .filter((lesson) => lesson.isPreview).length
                }
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function formatCoursePrice(price: number | null, currency: string) {
  if (!price || price <= 0) {
    return "Free";
  }

  return `${Number(price).toFixed(2)} ${currency}`;
}
