const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { ROLES } = require('../auth/auth.constants');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  postQuiz,
  getQuizDetail,
  postQuizAttempt,
  postQuizAnswer,
  postSubmitQuizAttempt,
  getQuizAttemptDetail,
  getMyAttempts,
} = require('./quiz.controller');
const {
  createQuizSchema,
  quizParamsSchema,
  quizAttemptParamsSchema,
  submitAnswerSchema,
  submitQuizSchema,
} = require('./quiz.validation');

const router = express.Router();

router.use(authenticate);

// Creator/Admin routes
const canManageQuizzes = authorizeRoles(ROLES.ADMIN, ROLES.CREATOR);

router.post(
  '/',
  canManageQuizzes,
  validateRequest(createQuizSchema),
  asyncHandler(postQuiz)
);

// Learner and general routes
router.get(
  '/:quizId',
  validateRequest(quizParamsSchema, 'params'),
  asyncHandler(getQuizDetail)
);

router.post(
  '/:quizId/attempts',
  validateRequest(quizParamsSchema, 'params'),
  authorizeRoles(ROLES.LEARNER),
  asyncHandler(postQuizAttempt)
);

router.post(
  '/:quizId/attempts/:attemptId/answers',
  validateRequest(quizAttemptParamsSchema, 'params'),
  validateRequest(submitAnswerSchema),
  authorizeRoles(ROLES.LEARNER),
  asyncHandler(postQuizAnswer)
);

router.post(
  '/:quizId/attempts/:attemptId/submit',
  validateRequest(quizAttemptParamsSchema, 'params'),
  authorizeRoles(ROLES.LEARNER),
  asyncHandler(postSubmitQuizAttempt)
);

router.get(
  '/:quizId/attempts/:attemptId',
  validateRequest(quizAttemptParamsSchema, 'params'),
  asyncHandler(getQuizAttemptDetail)
);

router.get(
  '/:quizId/my-attempts',
  validateRequest(quizParamsSchema, 'params'),
  authorizeRoles(ROLES.LEARNER),
  asyncHandler(getMyAttempts)
);

module.exports = router;
