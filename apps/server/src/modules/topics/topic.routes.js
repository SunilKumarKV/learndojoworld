const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { ROLES } = require('../auth/auth.constants');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getTopicDetail,
  getTopics,
  postApproveTopic,
  postContentBlocks,
  postSubmitForReview,
  postTopic,
} = require('./topic.controller');
const {
  addContentBlocksSchema,
  createTopicSchema,
  topicListQuerySchema,
  topicParamsSchema,
} = require('./topic.validation');

const router = express.Router();
const canCreateTopics = authorizeRoles(ROLES.ADMIN, ROLES.CREATOR);
const canApproveTopics = authorizeRoles(ROLES.ADMIN);

router.use(authenticate);

router.get(
  '/',
  validateRequest(topicListQuerySchema, 'query'),
  asyncHandler(getTopics)
);
router.post(
  '/',
  canCreateTopics,
  validateRequest(createTopicSchema),
  asyncHandler(postTopic)
);

router.get(
  '/:topicId',
  validateRequest(topicParamsSchema, 'params'),
  asyncHandler(getTopicDetail)
);
router.post(
  '/:topicId/blocks',
  canCreateTopics,
  validateRequest(topicParamsSchema, 'params'),
  validateRequest(addContentBlocksSchema),
  asyncHandler(postContentBlocks)
);
router.post(
  '/:topicId/submit-review',
  canCreateTopics,
  validateRequest(topicParamsSchema, 'params'),
  asyncHandler(postSubmitForReview)
);
router.post(
  '/:topicId/approve',
  canApproveTopics,
  validateRequest(topicParamsSchema, 'params'),
  asyncHandler(postApproveTopic)
);

module.exports = router;
