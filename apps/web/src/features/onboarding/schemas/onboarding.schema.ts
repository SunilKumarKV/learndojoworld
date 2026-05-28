import { z } from "zod";

export const onboardingSchema = z.object({
  goals: z.array(z.string()).min(1, "Select at least one learning goal."),
  topics: z.array(z.string()).min(1, "Choose at least one topic to focus on."),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  dailyGoalMin: z.coerce.number().int().min(15, "Daily learning time must be at least 15 minutes."),
  learningStyle: z.array(z.string()).min(1, "Pick at least one learning style."),
});

export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingFormValues = z.output<typeof onboardingSchema>;
