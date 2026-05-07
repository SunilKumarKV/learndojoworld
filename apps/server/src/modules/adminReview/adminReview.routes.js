const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { ROLES } = require('../auth/auth.constants');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getCreator,
  getCreators,
  getReviewContent,
  getReviewQueue,
  postApproveContent,
  postFlagContent,
  postPublishContent,
  postRejectContent,
} = require('./adminReview.controller');
const {
  contentParamsSchema,
  creatorParamsSchema,
  reviewQueueQuerySchema,
  reviewReasonSchema,
} = require('./adminReview.validation');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get(
  '/queue',
  validateRequest(reviewQueueQuerySchema, 'query'),
  asyncHandler(getReviewQueue)
);
router.get('/creators', asyncHandler(getCreators));
router.get(
  '/creators/:creatorId',
  validateRequest(creatorParamsSchema, 'params'),
  asyncHandler(getCreator)
);
router.get(
  '/content/:contentType/:contentId',
  validateRequest(contentParamsSchema, 'params'),
  asyncHandler(getReviewContent)
);
router.post(
  '/content/:contentType/:contentId/approve',
  validateRequest(contentParamsSchema, 'params'),
  asyncHandler(postApproveContent)
);
router.post(
  '/content/:contentType/:contentId/reject',
  validateRequest(contentParamsSchema, 'params'),
  validateRequest(reviewReasonSchema),
  asyncHandler(postRejectContent)
);
router.post(
  '/content/:contentType/:contentId/publish',
  validateRequest(contentParamsSchema, 'params'),
  asyncHandler(postPublishContent)
);
router.post(
  '/content/:contentType/:contentId/flag',
  validateRequest(contentParamsSchema, 'params'),
  validateRequest(reviewReasonSchema),
  asyncHandler(postFlagContent)
);

module.exports = router;
