const { z } = require('zod');
const { CONTENT_BLOCK_TYPE } = require('../topics/topic.constants');
const { createTopicSchema } = require('../topics/topic.validation');
const { QUIZ_QUESTION_TYPE } = require('./creatorStudio.constants');

const stringId = z.string().min(1, 'Identifier is required');

const slugSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(160, 'Slug must be 160 characters or less')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL friendly');

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or less`)
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .or(z.literal(''))
  .optional()
  .transform((value) => (value === '' ? null : value));

const contentBlockTypeSchema = z.enum(Object.values(CONTENT_BLOCK_TYPE));
const quizQuestionTypeSchema = z.enum(Object.values(QUIZ_QUESTION_TYPE));

const courseParamsSchema = z.object({
  courseId: stringId,
});

const moduleParamsSchema = z.object({
  moduleId: stringId,
});

const lessonParamsSchema = z.object({
  lessonId: stringId,
});

const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  slug: slugSchema.optional(),
  subtitle: optionalText(180, 'Subtitle'),
  description: optionalText(3000, 'Description'),
  level: optionalText(80, 'Level'),
});

const createModuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  slug: slugSchema.optional(),
  summary: optionalText(600, 'Summary'),
  order: z.number().int().min(0).optional(),
});

const createLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  slug: slugSchema.optional(),
  summary: optionalText(800, 'Summary'),
  videoUrl: optionalUrl,
  topicPageId: stringId.optional(),
  order: z.number().int().min(0).optional(),
});

const updateLessonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(140, 'Title must be 140 characters or less')
      .optional(),
    summary: optionalText(800, 'Summary'),
    videoUrl: optionalUrl,
    topicPageId: stringId.nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one lesson field to update',
  });

const lessonNoteBlockSchema = z.object({
  type: contentBlockTypeSchema,
  title: optionalText(140, 'Block title'),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(30000, 'Content must be 30000 characters or less'),
  language: optionalText(40, 'Language'),
  referenceId: optionalText(200, 'Reference id'),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const addLessonNotesSchema = z.object({
  blocks: z.array(lessonNoteBlockSchema).min(1, 'Add at least one note block'),
});

const quizQuestionSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Question prompt must be at least 3 characters')
    .max(2000, 'Question prompt must be 2000 characters or less'),
  type: quizQuestionTypeSchema.default(QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE),
  options: z.array(z.string().trim().min(1)).max(8).optional(),
  correctAnswer: z
    .string()
    .trim()
    .min(1, 'Correct answer is required')
    .max(1000, 'Correct answer must be 1000 characters or less'),
  explanation: optionalText(2000, 'Explanation'),
  order: z.number().int().min(0).optional(),
});

const upsertQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Quiz title must be at least 3 characters')
    .max(140, 'Quiz title must be 140 characters or less'),
  instructions: optionalText(1000, 'Instructions'),
  questions: z.array(quizQuestionSchema).min(1, 'Add at least one question'),
});

const createStudioTopicSchema = z.object({
  topic: createTopicSchema,
  blocks: z.array(lessonNoteBlockSchema).optional().default([]),
});

module.exports = {
  courseParamsSchema,
  moduleParamsSchema,
  lessonParamsSchema,
  createCourseSchema,
  createModuleSchema,
  createLessonSchema,
  updateLessonSchema,
  addLessonNotesSchema,
  upsertQuizSchema,
  createStudioTopicSchema,
};
