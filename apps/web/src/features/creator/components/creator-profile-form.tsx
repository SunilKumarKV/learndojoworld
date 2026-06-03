"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Save } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { CreatorProfile, CreatorProfilePayload } from "@/services/creator.api";

const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Add a public creator name.").max(80),
  bio: z.string().trim().min(24, "Add a short bio with at least 24 characters.").max(800),
  expertise: z.string().trim().min(2, "Add at least one area of expertise."),
  websiteUrl: z
    .string()
    .trim()
    .url("Use a full URL including https://")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .trim()
    .url("Use a full URL including https://")
    .optional()
    .or(z.literal("")),
  youtubeUrl: z
    .string()
    .trim()
    .url("Use a full URL including https://")
    .optional()
    .or(z.literal("")),
});

type CreatorProfileFormValues = z.infer<typeof creatorProfileSchema>;

type CreatorProfileFormProps = {
  initialProfile?: CreatorProfile | null | undefined;
  isSubmitting: boolean;
  mode: "apply" | "settings";
  onSubmit: (payload: CreatorProfilePayload) => Promise<void>;
};

const inputClass =
  "mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const textareaClass =
  "mt-2 min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function CreatorProfileForm({
  initialProfile,
  isSubmitting,
  mode,
  onSubmit,
}: CreatorProfileFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreatorProfileFormValues>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: getDefaultValues(initialProfile),
  });

  useEffect(() => {
    reset(getDefaultValues(initialProfile));
  }, [initialProfile, reset]);

  async function submit(values: CreatorProfileFormValues) {
    await onSubmit({
      bio: values.bio.trim(),
      displayName: values.displayName.trim(),
      expertise: values.expertise
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      linkedinUrl: values.linkedinUrl?.trim() || undefined,
      websiteUrl: values.websiteUrl?.trim() || undefined,
      youtubeUrl: values.youtubeUrl?.trim() || undefined,
    });
  }

  const SubmitIcon = mode === "apply" ? ArrowRight : Save;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
    >
      <FormField error={errors.displayName?.message} label="Display name">
        <input
          className={inputClass}
          placeholder="Your public creator name"
          {...register("displayName")}
        />
      </FormField>

      <FormField error={errors.bio?.message} label="Bio">
        <textarea
          className={textareaClass}
          placeholder="Tell learners what you teach, who you help, and why your perspective is useful."
          {...register("bio")}
        />
      </FormField>

      <FormField error={errors.expertise?.message} label="Expertise">
        <input
          className={inputClass}
          placeholder="Product design, Python, IIT-JEE Math"
          {...register("expertise")}
        />
      </FormField>

      <div className="grid gap-5 md:grid-cols-3">
        <FormField error={errors.websiteUrl?.message} label="Website">
          <input
            className={inputClass}
            placeholder="https://example.com"
            {...register("websiteUrl")}
          />
        </FormField>
        <FormField error={errors.linkedinUrl?.message} label="LinkedIn">
          <input
            className={inputClass}
            placeholder="https://linkedin.com/in/..."
            {...register("linkedinUrl")}
          />
        </FormField>
        <FormField error={errors.youtubeUrl?.message} label="YouTube">
          <input
            className={inputClass}
            placeholder="https://youtube.com/..."
            {...register("youtubeUrl")}
          />
        </FormField>
      </div>

      <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
        <SubmitIcon aria-hidden className="h-4 w-4" />
        {isSubmitting
          ? mode === "apply"
            ? "Creating studio"
            : "Saving"
          : mode === "apply"
            ? "Become a creator"
            : "Save profile"}
      </Button>
    </form>
  );
}

function FormField({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error: string | undefined;
  label: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-900">
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function getDefaultValues(profile?: CreatorProfile | null): CreatorProfileFormValues {
  return {
    bio: profile?.bio ?? "",
    displayName: profile?.displayName ?? "",
    expertise: profile?.expertise.join(", ") ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
    youtubeUrl: profile?.youtubeUrl ?? "",
  };
}
