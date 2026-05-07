const { z } = require('zod');
const { CONTENT_BLOCK_TYPE, TOPIC_STATUS } = require('./topic.constants');

const stringId = z.string().min(1, 'Identifier is required');

const topicParamsSchema = z.object({
  topicId: stringId,
});

const topicListQuerySchema = z.object({
  roadmapNodeId: stringId.optional(),
});

const topicStatusSchema = z.enum(Object.values(TOPIC_STATUS));
const contentBlockTypeSchema = z.enum(Object.values(CONTENT_BLOCK_TYPE));

const slugSchema = z
  .string()
  .trim()
  .min(3, 'Slug must be at least 3 characters')
  .max(160, 'Slug must be 160 characters or less')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL friendly');

const createTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  slug: slugSchema.optional(),
  summary: z
    .string()
    .trim()
    .max(1000, 'Summary must be 1000 characters or less')
    .optional(),
  roadmapNodeId: stringId.optional(),
  status: topicStatusSchema
    .optional()
    .default(TOPIC_STATUS.DRAFT)
    .refine(
      (status) => [TOPIC_STATUS.DRAFT, TOPIC_STATUS.SUBMITTED].includes(status),
      {
        message: 'Topics must go through admin review before publishing',
      }
    ),
});

const addContentBlockSchema = z.object({
  type: contentBlockTypeSchema,
  title: z
    .string()
    .trim()
    .max(140, 'Title must be 140 characters or less')
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(30000, 'Content must be 30000 characters or less'),
  language: z
    .string()
    .trim()
    .max(40, 'Language must be 40 characters or less')
    .optional(),
  referenceId: z
    .string()
    .trim()
    .max(200, 'Reference id must be 200 characters or less')
    .optional(),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const addContentBlocksSchema = z.object({
  blocks: z.array(addContentBlockSchema).min(1, 'Add at least one block'),
});

module.exports = {
  topicParamsSchema,
  topicListQuerySchema,
  createTopicSchema,
  addContentBlockSchema,
  addContentBlocksSchema,
};
