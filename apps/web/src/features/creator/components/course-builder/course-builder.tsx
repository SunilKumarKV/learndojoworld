"use client";

import {
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Layers3,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreatorCourse, useCreatorCourseMutations } from "@/features/creator/hooks/use-creator";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useCategories } from "@/features/courses/hooks/use-courses";
import type {
  CreatorCourseDetail,
  CreatorCoursePayload,
  CreatorLesson,
  CreatorModule,
} from "@/services/creator.api";

type BuilderStep = "basic" | "curriculum" | "review";

type CourseBuilderProps = {
  courseId?: string | undefined;
};

const inputClass =
  "mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const textareaClass =
  "mt-2 min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function CourseBuilder({ courseId }: CourseBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState<BuilderStep>("basic");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const courseQuery = useCreatorCourse(courseId);
  const categoriesQuery = useCategories();
  const course = courseQuery.data ?? null;
  const mutations = useCreatorCourseMutations(course?.id ?? courseId);
  const [basicInfo, setBasicInfo] = useState<CreatorCoursePayload>({
    categoryId: "",
    description: "",
    difficulty: "BEGINNER",
    language: "English",
    subtitle: "",
    thumbnailUrl: "",
    title: "",
  });

  useEffect(() => {
    if (!course) return;
    setBasicInfo({
      categoryId: course.categoryId ?? "",
      description: course.description,
      difficulty: course.difficulty,
      language: course.language,
      subtitle: course.subtitle ?? "",
      thumbnailUrl: course.thumbnailUrl ?? "",
      title: course.title,
    });
  }, [course]);

  const checklist = useMemo(() => getChecklist(course, basicInfo), [basicInfo, course]);
  const isReadyForReview = Object.values(checklist).every(Boolean);
  const isSavingBasic = mutations.createCourse.isPending || mutations.updateCourse.isPending;

  async function saveBasicInfo() {
    setErrorMessage("");
    setSuccessMessage("");
    const payload = normalizeBasicInfo(basicInfo);

    if (!payload.title || !payload.description || !payload.categoryId) {
      setErrorMessage("Title, description, and category are required before saving.");
      return;
    }

    try {
      if (course?.id) {
        await mutations.updateCourse.mutateAsync(payload);
        setSuccessMessage("Course saved.");
      } else {
        const created = await mutations.createCourse.mutateAsync(payload);
        setSuccessMessage("Course created.");
        router.replace(`/creator/courses/${created.id}/edit` as Route);
        setStep("curriculum");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save course.");
    }
  }

  async function submitForReview() {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await mutations.submitForReview.mutateAsync();
      setSuccessMessage("Course submitted for review.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit course.");
    }
  }

  if (courseId && courseQuery.isLoading) return <LoadingState />;
  if (courseId && courseQuery.isError) {
    return (
      <ErrorState
        message={
          courseQuery.error instanceof Error ? courseQuery.error.message : "Unable to load course."
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Course Builder
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {course ? course.title : "Create a course"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Build a draft course with real modules and text lessons. Review submission is a
              placeholder state until admin approval exists.
            </p>
          </div>
          {course ? (
            <Button asChild variant="secondary">
              <Link href={`/creator/courses/${course.id}/preview` as Route}>
                <Eye aria-hidden className="h-4 w-4" />
                Preview
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Course builder steps">
        <StepButton
          active={step === "basic"}
          icon={<FileText />}
          label="Basic Info"
          onClick={() => setStep("basic")}
        />
        <StepButton
          active={step === "curriculum"}
          icon={<Layers3 />}
          label="Curriculum"
          onClick={() => setStep("curriculum")}
        />
        <StepButton
          active={step === "review"}
          icon={<CheckCircle2 />}
          label="Review"
          onClick={() => setStep("review")}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {step === "basic" ? (
        <BasicInfoStep
          categories={categoriesQuery.data ?? []}
          isLoadingCategories={categoriesQuery.isLoading}
          isSaving={isSavingBasic}
          onChange={setBasicInfo}
          onSave={() => void saveBasicInfo()}
          value={basicInfo}
        />
      ) : null}

      {step === "curriculum" ? (
        <CurriculumStep
          course={course}
          mutations={mutations}
          onRequireCourse={() => setStep("basic")}
        />
      ) : null}

      {step === "review" ? (
        <ReviewStep
          checklist={checklist}
          course={course}
          isSubmitting={mutations.submitForReview.isPending}
          onSubmit={() => void submitForReview()}
          ready={isReadyForReview}
        />
      ) : null}
    </div>
  );
}

function StepButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition ${
        active
          ? "border-primary bg-primary text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function BasicInfoStep({
  categories,
  isLoadingCategories,
  isSaving,
  onChange,
  onSave,
  value,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
  isLoadingCategories: boolean;
  isSaving: boolean;
  onChange: (value: CreatorCoursePayload) => void;
  onSave: () => void;
  value: CreatorCoursePayload;
}) {
  function update(patch: Partial<CreatorCoursePayload>) {
    onChange({ ...value, ...patch });
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
        <h3 className="text-xl font-semibold text-slate-950">Basic Info</h3>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title">
            <input
              className={inputClass}
              value={value.title}
              onChange={(event) => update({ title: event.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <input
              className={inputClass}
              value={value.subtitle ?? ""}
              onChange={(event) => update({ subtitle: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={textareaClass}
            value={value.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Category">
            <select
              className={inputClass}
              disabled={isLoadingCategories}
              value={value.categoryId}
              onChange={(event) => update({ categoryId: event.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              className={inputClass}
              value={value.difficulty}
              onChange={(event) =>
                update({
                  difficulty: event.target.value as CreatorCoursePayload["difficulty"],
                })
              }
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </Field>
          <Field label="Language">
            <input
              className={inputClass}
              value={value.language}
              onChange={(event) => update({ language: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Thumbnail URL">
          <input
            className={inputClass}
            placeholder="https://..."
            value={value.thumbnailUrl ?? ""}
            onChange={(event) => update({ thumbnailUrl: event.target.value })}
          />
        </Field>
        <Button disabled={isSaving} onClick={onSave} type="button">
          <Save aria-hidden className="h-4 w-4" />
          {isSaving ? "Saving" : "Save draft"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CurriculumStep({
  course,
  mutations,
  onRequireCourse,
}: {
  course: CreatorCourseDetail | null;
  mutations: ReturnType<typeof useCreatorCourseMutations>;
  onRequireCourse: () => void;
}) {
  const [moduleTitle, setModuleTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function addModule() {
    if (!course) {
      onRequireCourse();
      return;
    }
    if (!moduleTitle.trim()) return;
    setErrorMessage("");
    try {
      await mutations.createModule.mutateAsync({ title: moduleTitle.trim() });
      setModuleTitle("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add module.");
    }
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold text-slate-950">Save basic info first</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A course draft is required before modules and lessons can be attached.
          </p>
          <Button className="mt-5" onClick={onRequireCourse}>
            Go to basic info
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
          <h3 className="text-xl font-semibold text-slate-950">Curriculum</h3>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={inputClass}
              placeholder="Module title"
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
            />
            <Button
              disabled={mutations.createModule.isPending}
              onClick={() => void addModule()}
              type="button"
            >
              <Plus aria-hidden className="h-4 w-4" />
              Add module
            </Button>
          </div>
        </CardContent>
      </Card>

      {course.modules.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <BookOpen className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-xl font-semibold text-slate-950">No modules yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add a module, then add at least one text lesson before submitting for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules.map((module) => (
            <ModuleEditor key={module.id} module={module} mutations={mutations} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleEditor({
  module,
  mutations,
}: {
  module: CreatorModule;
  mutations: ReturnType<typeof useCreatorCourseMutations>;
}) {
  const [title, setTitle] = useState(module.title);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setTitle(module.title);
  }, [module.title]);

  async function saveModule() {
    setErrorMessage("");
    try {
      await mutations.updateModule.mutateAsync({ moduleId: module.id, payload: { title } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save module.");
    }
  }

  async function deleteModule() {
    setErrorMessage("");
    try {
      await mutations.deleteModule.mutateAsync(module.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete module.");
    }
  }

  async function addLesson() {
    if (!lessonTitle.trim() || !lessonContent.trim()) return;
    setErrorMessage("");
    try {
      await mutations.createLesson.mutateAsync({
        moduleId: module.id,
        payload: { content: lessonContent.trim(), title: lessonTitle.trim(), type: "TEXT" },
      });
      setLessonTitle("");
      setLessonContent("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add lesson.");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft-xl">
      {errorMessage ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Field label={`Module ${module.order}`}>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Button
          disabled={mutations.updateModule.isPending}
          onClick={() => void saveModule()}
          type="button"
          variant="secondary"
        >
          <Save aria-hidden className="h-4 w-4" />
          Save
        </Button>
        <Button
          disabled={mutations.deleteModule.isPending}
          onClick={() => void deleteModule()}
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Add text lesson</p>
        <div className="mt-3 grid gap-3">
          <input
            className={inputClass}
            placeholder="Lesson title"
            value={lessonTitle}
            onChange={(event) => setLessonTitle(event.target.value)}
          />
          <textarea
            className={textareaClass}
            placeholder="Lesson content"
            value={lessonContent}
            onChange={(event) => setLessonContent(event.target.value)}
          />
          <Button
            disabled={mutations.createLesson.isPending}
            onClick={() => void addLesson()}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add lesson
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {module.lessons.map((lesson) => (
          <LessonEditor key={lesson.id} lesson={lesson} mutations={mutations} />
        ))}
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  mutations,
}: {
  lesson: CreatorLesson;
  mutations: ReturnType<typeof useCreatorCourseMutations>;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setTitle(lesson.title);
    setContent(lesson.content);
  }, [lesson.content, lesson.title]);

  async function saveLesson() {
    setErrorMessage("");
    try {
      await mutations.updateLesson.mutateAsync({
        lessonId: lesson.id,
        payload: { content, title, type: "TEXT" },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save lesson.");
    }
  }

  async function deleteLesson() {
    setErrorMessage("");
    try {
      await mutations.deleteLesson.mutateAsync(lesson.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete lesson.");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {errorMessage ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <div className="grid gap-3">
        <Field label={`Lesson ${lesson.order}`}>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field label="Content">
          <textarea
            className={textareaClass}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={mutations.updateLesson.isPending}
            onClick={() => void saveLesson()}
            type="button"
            variant="secondary"
          >
            <Save aria-hidden className="h-4 w-4" />
            Save lesson
          </Button>
          <Button
            disabled={mutations.deleteLesson.isPending}
            onClick={() => void deleteLesson()}
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  checklist,
  course,
  isSubmitting,
  onSubmit,
  ready,
}: {
  checklist: Record<string, boolean>;
  course: CreatorCourseDetail | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  ready: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
        <h3 className="text-xl font-semibold text-slate-950">Review</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryItem label="Title" value={course?.title ?? "Not saved"} />
          <SummaryItem label="Status" value={course?.status ?? "DRAFT"} />
          <SummaryItem label="Modules" value={String(course?.modules.length ?? 0)} />
          <SummaryItem
            label="Lessons"
            value={String(
              course?.modules.reduce((total, module) => total + module.lessons.length, 0) ?? 0,
            )}
          />
        </div>
        <div className="rounded-lg bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-950">Validation checklist</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(checklist).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2
                  className={`h-4 w-4 ${value ? "text-emerald-600" : "text-slate-300"}`}
                />
                {checklistLabel[key] ?? key}
              </div>
            ))}
          </div>
        </div>
        <Button
          disabled={!course || !ready || isSubmitting || course.status === "PENDING_REVIEW"}
          onClick={onSubmit}
          type="button"
        >
          <Send aria-hidden className="h-4 w-4" />
          {course?.status === "PENDING_REVIEW" ? "Submitted for review" : "Submit for review"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block flex-1 text-sm font-semibold text-slate-900">
      {label}
      {children}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function normalizeBasicInfo(value: CreatorCoursePayload): CreatorCoursePayload {
  return {
    categoryId: value.categoryId,
    description: value.description.trim(),
    difficulty: value.difficulty,
    language: value.language.trim() || "English",
    subtitle: value.subtitle?.trim() || undefined,
    thumbnailUrl: value.thumbnailUrl?.trim() || undefined,
    title: value.title.trim(),
  };
}

function getChecklist(course: CreatorCourseDetail | null, basicInfo: CreatorCoursePayload) {
  return {
    hasTitle: Boolean((course?.title ?? basicInfo.title).trim()),
    hasDescription: Boolean((course?.description ?? basicInfo.description).trim()),
    hasCategory: Boolean(course?.categoryId ?? basicInfo.categoryId),
    hasModule: (course?.modules.length ?? 0) > 0,
    hasLesson: course?.modules.some((module) => module.lessons.length > 0) ?? false,
  };
}

const checklistLabel: Record<string, string> = {
  hasCategory: "Category selected",
  hasDescription: "Description added",
  hasLesson: "At least one lesson",
  hasModule: "At least one module",
  hasTitle: "Title added",
};
