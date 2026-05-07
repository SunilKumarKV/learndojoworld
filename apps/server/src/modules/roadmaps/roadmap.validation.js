const { z } = require('zod');
const { NODE_PROGRESS_STATUS, ROADMAP_STATUS } = require('./roadmap.constants');

const stringId = z.string().min(1, 'Identifier is required');

const roadmapParamsSchema = z.object({
  roadmapId: stringId,
});

const roadmapNodeParamsSchema = z.object({
  roadmapId: stringId,
  nodeId: stringId,
});

const roadmapStatusSchema = z.enum(Object.values(ROADMAP_STATUS));
const nodeProgressStatusSchema = z.enum(Object.values(NODE_PROGRESS_STATUS));

const createRoadmapSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or less'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(140, 'Slug must be 140 characters or less')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL friendly')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  status: roadmapStatusSchema.optional().default(ROADMAP_STATUS.PUBLISHED),
});

const createRoadmapNodeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(160, 'Slug must be 160 characters or less')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL friendly')
    .optional(),
  summary: z
    .string()
    .trim()
    .max(500, 'Summary must be 500 characters or less')
    .optional(),
  content: z
    .string()
    .trim()
    .max(20000, 'Content must be 20000 characters or less')
    .optional(),
  order: z.number().int().min(0).optional(),
});

const addPrerequisitesSchema = z.object({
  prerequisiteNodeIds: z
    .array(stringId)
    .min(1, 'Select at least one prerequisite node'),
});

const updateNodeProgressSchema = z.object({
  status: nodeProgressStatusSchema,
});

module.exports = {
  roadmapParamsSchema,
  roadmapNodeParamsSchema,
  createRoadmapSchema,
  createRoadmapNodeSchema,
  addPrerequisitesSchema,
  updateNodeProgressSchema,
};
