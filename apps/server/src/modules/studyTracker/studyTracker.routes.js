const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ROLES } = require('../auth/auth.constants');
const {
  getDashboard,
  patchRevisionItem,
  patchStudyPlan,
  patchStudySessionComplete,
  postRevisionItem,
  postStudyPlan,
  postStudySession,
} = require('./studyTracker.controller');
const {
  completeStudySessionSchema,
  createRevisionItemSchema,
  createStudyPlanSchema,
  dashboardQuerySchema,
  planParamsSchema,
  revisionParamsSchema,
  sessionParamsSchema,
  startStudySessionSchema,
  updateRevisionItemSchema,
  updateStudyPlanSchema,
} = require('./studyTracker.validation');

const router = express.Router();
const canUseStudyTracker = authorizeRoles(ROLES.LEARNER);

router.use(authenticate);
router.use(canUseStudyTracker);

router.get(
  '/dashboard',
  validateRequest(dashboardQuerySchema, 'query'),
  asyncHandler(getDashboard)
);
router.post(
  '/plans',
  validateRequest(createStudyPlanSchema),
  asyncHandler(postStudyPlan)
);
router.patch(
  '/plans/:planId',
  validateRequest(planParamsSchema, 'params'),
  validateRequest(updateStudyPlanSchema),
  asyncHandler(patchStudyPlan)
);
router.post(
  '/sessions',
  validateRequest(startStudySessionSchema),
  asyncHandler(postStudySession)
);
router.patch(
  '/sessions/:sessionId/complete',
  validateRequest(sessionParamsSchema, 'params'),
  validateRequest(completeStudySessionSchema),
  asyncHandler(patchStudySessionComplete)
);
router.post(
  '/revisions',
  validateRequest(createRevisionItemSchema),
  asyncHandler(postRevisionItem)
);
router.patch(
  '/revisions/:revisionId',
  validateRequest(revisionParamsSchema, 'params'),
  validateRequest(updateRevisionItemSchema),
  asyncHandler(patchRevisionItem)
);

module.exports = router;
