const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getDueFlashcards,
  postFlashcard,
  postFlashcardReview,
} = require('./flashcards.controller');
const {
  createFlashcardSchema,
  flashcardParamsSchema,
  reviewFlashcardSchema,
} = require('./flashcards.validation');

const router = express.Router();

router.use(authenticate);

router.get('/due', asyncHandler(getDueFlashcards));
router.post(
  '/',
  validateRequest(createFlashcardSchema),
  asyncHandler(postFlashcard)
);
router.post(
  '/:flashcardId/review',
  validateRequest(flashcardParamsSchema, 'params'),
  validateRequest(reviewFlashcardSchema),
  asyncHandler(postFlashcardReview)
);

module.exports = router;
