const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ROLES } = require('../auth/auth.constants');
const {
  getDoubts,
  getModerationReports,
  patchModeratedDoubt,
  patchModeratedReply,
  patchReportReview,
  postAcceptedAnswer,
  postDoubt,
  postDoubtReport,
  postDoubtVote,
  postOfficialAnswer,
  postReply,
  postReplyReport,
  postReplyVote,
} = require('./doubt.controller');
const {
  createDoubtSchema,
  createReplySchema,
  doubtListQuerySchema,
  doubtParamsSchema,
  moderateDoubtSchema,
  moderateReplySchema,
  moderationReportsQuerySchema,
  replyParamsSchema,
  reportContentSchema,
  reportParamsSchema,
  reviewReportSchema,
} = require('./doubt.validation');

const router = express.Router();
const canModerateDoubts = authorizeRoles(ROLES.ADMIN);

router.use(authenticate);

router.get(
  '/moderation/reports',
  canModerateDoubts,
  validateRequest(moderationReportsQuerySchema, 'query'),
  asyncHandler(getModerationReports)
);
router.patch(
  '/moderation/doubts/:doubtId',
  canModerateDoubts,
  validateRequest(doubtParamsSchema, 'params'),
  validateRequest(moderateDoubtSchema),
  asyncHandler(patchModeratedDoubt)
);
router.patch(
  '/moderation/replies/:replyId',
  canModerateDoubts,
  validateRequest(replyParamsSchema.pick({ replyId: true }), 'params'),
  validateRequest(moderateReplySchema),
  asyncHandler(patchModeratedReply)
);
router.patch(
  '/moderation/reports/:reportId',
  canModerateDoubts,
  validateRequest(reportParamsSchema, 'params'),
  validateRequest(reviewReportSchema),
  asyncHandler(patchReportReview)
);

router.get(
  '/',
  validateRequest(doubtListQuerySchema, 'query'),
  asyncHandler(getDoubts)
);
router.post('/', validateRequest(createDoubtSchema), asyncHandler(postDoubt));
router.post(
  '/:doubtId/replies',
  validateRequest(doubtParamsSchema, 'params'),
  validateRequest(createReplySchema),
  asyncHandler(postReply)
);
router.post(
  '/:doubtId/replies/:replyId/official',
  validateRequest(replyParamsSchema, 'params'),
  asyncHandler(postOfficialAnswer)
);
router.post(
  '/:doubtId/replies/:replyId/accept',
  validateRequest(replyParamsSchema, 'params'),
  asyncHandler(postAcceptedAnswer)
);
router.post(
  '/:doubtId/upvote',
  validateRequest(doubtParamsSchema, 'params'),
  asyncHandler(postDoubtVote)
);
router.post(
  '/:doubtId/replies/:replyId/upvote',
  validateRequest(replyParamsSchema, 'params'),
  asyncHandler(postReplyVote)
);
router.post(
  '/:doubtId/report',
  validateRequest(doubtParamsSchema, 'params'),
  validateRequest(reportContentSchema),
  asyncHandler(postDoubtReport)
);
router.post(
  '/:doubtId/replies/:replyId/report',
  validateRequest(replyParamsSchema, 'params'),
  validateRequest(reportContentSchema),
  asyncHandler(postReplyReport)
);

module.exports = router;
