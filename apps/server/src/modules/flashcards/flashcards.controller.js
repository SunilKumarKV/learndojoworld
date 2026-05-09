const { successResponse } = require('../../utils/apiResponse');
const {
  createFlashcard,
  getFlashcardsDue,
  reviewFlashcard,
} = require('./flashcards.service');

async function getDueFlashcards(req, res) {
  const { date } = req.query;
  const today = date ? new Date(`${date}T00:00:00`) : new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const flashcards = await getFlashcardsDue(req.user, { start, end });
  return successResponse(res, { flashcards }, 'Flashcards due retrieved');
}

async function postFlashcard(req, res) {
  const flashcard = await createFlashcard(req.user, req.body);
  return successResponse(res, { flashcard }, 'Flashcard created', 201);
}

async function postFlashcardReview(req, res) {
  const flashcard = await reviewFlashcard(
    req.user,
    req.params.flashcardId,
    req.body
  );
  return successResponse(res, { flashcard }, 'Flashcard reviewed');
}

module.exports = {
  getDueFlashcards,
  postFlashcard,
  postFlashcardReview,
};
