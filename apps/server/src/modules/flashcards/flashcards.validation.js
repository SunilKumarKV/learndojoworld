const { z } = require('zod');

const stringId = z.string().min(1, 'Identifier is required');
const optionalId = stringId.optional();

const createFlashcardSchema = z.object({
  topicPageId: optionalId,
  frontText: z
    .string()
    .trim()
    .min(3, 'Flashcard front must be at least 3 characters'),
  backText: z
    .string()
    .trim()
    .min(1, 'Flashcard back must be at least 1 character')
    .optional(),
});

const flashcardParamsSchema = z.object({
  flashcardId: stringId,
});

const reviewFlashcardSchema = z.object({
  grade: z.enum(['EASY', 'GOOD', 'HARD', 'FORGOT']),
});

module.exports = {
  createFlashcardSchema,
  flashcardParamsSchema,
  reviewFlashcardSchema,
};
