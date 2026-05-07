const { z } = require('zod');
const { DOUBT_REPORT_STATUS, DOUBT_STATUS } = require('./doubt.constants');

const stringId = z.string().min(1, 'Identifier is required');

const doubtParamsSchema = z.object({
  doubtId: stringId,
});

const replyParamsSchema = z.object({
  doubtId: stringId,
  replyId: stringId,
});

const reportParamsSchema = z.object({
  reportId: stringId,
});

const doubtListQuerySchema = z
  .object({
    topicPageId: stringId.optional(),
    roadmapNodeId: stringId.optional(),
    status: z.enum(Object.values(DOUBT_STATUS)).optional(),
  })
  .refine((query) => query.topicPageId || query.roadmapNodeId, {
    message: 'Filter doubts by topic page or roadmap node',
  });

const moderationReportsQuerySchema = z.object({
  status: z.enum(Object.values(DOUBT_REPORT_STATUS)).optional(),
});

const createDoubtSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(160, 'Title must be 160 characters or less'),
    content: z
      .string()
      .trim()
      .min(10, 'Doubt details must be at least 10 characters')
      .max(5000, 'Doubt details must be 5000 characters or less'),
    topicPageId: stringId.optional(),
    roadmapNodeId: stringId.optional(),
    videoTimestampSeconds: z.number().int().min(0).max(86400).optional(),
  })
  .refine((payload) => payload.topicPageId || payload.roadmapNodeId, {
    message: 'Attach the doubt to a topic page or roadmap node',
  });

const createReplySchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, 'Reply must be at least 3 characters')
    .max(5000, 'Reply must be 5000 characters or less'),
});

const reportContentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Report reason must be at least 5 characters')
    .max(1000, 'Report reason must be 1000 characters or less'),
});

const moderateDoubtSchema = z.object({
  status: z.enum(Object.values(DOUBT_STATUS)),
  moderationReason: z
    .string()
    .trim()
    .max(1000, 'Moderation reason must be 1000 characters or less')
    .optional(),
});

const moderateReplySchema = z.object({
  isHidden: z.boolean(),
  moderationReason: z
    .string()
    .trim()
    .max(1000, 'Moderation reason must be 1000 characters or less')
    .optional(),
});

const reviewReportSchema = z.object({
  status: z.enum(Object.values(DOUBT_REPORT_STATUS)),
  resolutionNotes: z
    .string()
    .trim()
    .max(1000, 'Resolution notes must be 1000 characters or less')
    .optional(),
});

module.exports = {
  doubtParamsSchema,
  replyParamsSchema,
  reportParamsSchema,
  doubtListQuerySchema,
  moderationReportsQuerySchema,
  createDoubtSchema,
  createReplySchema,
  reportContentSchema,
  moderateDoubtSchema,
  moderateReplySchema,
  reviewReportSchema,
};
