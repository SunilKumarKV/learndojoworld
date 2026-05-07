const { z } = require('zod');
const {
  REVISION_ITEM_STATUS,
  STUDY_PLAN_STATUS,
} = require('./studyTracker.constants');

const stringId = z.string().min(1, 'Identifier is required');
const optionalId = stringId.optional();
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');

const dashboardQuerySchema = z.object({
  date: dateOnly.optional(),
});

const planParamsSchema = z.object({
  planId: stringId,
});

const sessionParamsSchema = z.object({
  sessionId: stringId,
});

const revisionParamsSchema = z.object({
  revisionId: stringId,
});

const createStudyPlanSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or less'),
  description: z
    .string()
    .trim()
    .max(800, 'Description must be 800 characters or less')
    .optional(),
  plannedDate: z.coerce.date(),
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  roadmapId: optionalId,
  roadmapNodeId: optionalId,
});

const updateStudyPlanSchema = z.object({
  status: z.enum(Object.values(STUDY_PLAN_STATUS)),
});

const startStudySessionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(160, 'Title must be 160 characters or less')
    .optional(),
  roadmapId: optionalId,
  roadmapNodeId: optionalId,
  topicPageId: optionalId,
});

const completeStudySessionSchema = z.object({
  durationMinutes: z.number().int().min(1).max(1440).optional(),
});

const createRevisionItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or less'),
  reason: z
    .string()
    .trim()
    .max(800, 'Reason must be 800 characters or less')
    .optional(),
  dueAt: z.coerce.date(),
  confidence: z.number().int().min(0).max(100).optional(),
  intervalDays: z.number().int().min(1).max(365).optional(),
  roadmapNodeId: optionalId,
  topicPageId: optionalId,
});

const updateRevisionItemSchema = z.object({
  status: z.enum(Object.values(REVISION_ITEM_STATUS)).optional(),
  confidence: z.number().int().min(0).max(100).optional(),
});

module.exports = {
  dashboardQuerySchema,
  planParamsSchema,
  sessionParamsSchema,
  revisionParamsSchema,
  createStudyPlanSchema,
  updateStudyPlanSchema,
  startStudySessionSchema,
  completeStudySessionSchema,
  createRevisionItemSchema,
  updateRevisionItemSchema,
};
