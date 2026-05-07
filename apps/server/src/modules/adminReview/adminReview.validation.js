const { z } = require('zod');
const {
  CONTENT_TYPE_PARAM,
  REVIEW_STATUS,
} = require('./adminReview.constants');

const contentTypeParamSchema = z.enum([
  CONTENT_TYPE_PARAM.COURSE,
  CONTENT_TYPE_PARAM.TOPIC,
]);

const contentParamsSchema = z.object({
  contentType: contentTypeParamSchema,
  contentId: z.string().min(1, 'Content id is required'),
});

const creatorParamsSchema = z.object({
  creatorId: z.string().min(1, 'Creator id is required'),
});

const reviewQueueQuerySchema = z.object({
  status: z.enum(Object.values(REVIEW_STATUS)).optional(),
  contentType: contentTypeParamSchema.optional(),
});

const reviewReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(2000, 'Reason must be 2000 characters or less'),
});

module.exports = {
  contentParamsSchema,
  creatorParamsSchema,
  reviewQueueQuerySchema,
  reviewReasonSchema,
};
