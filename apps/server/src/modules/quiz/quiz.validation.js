const { z } = require('zod');
const { QUIZ_QUESTION_TYPE } = require('./quiz.constants');

const stringId = z.string().min(1, 'Identifier is required');

const quizParamsSchema = z.object({
  quizId: stringId,
});

const quizAttemptParamsSchema = z.object({
  quizId: stringId,
  attemptId: stringId,
});

const quizQuestionTypeSchema = z.enum(Object.values(QUIZ_QUESTION_TYPE));

const questionSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be 500 characters or less'),
  type: quizQuestionTypeSchema,
  options: z
    .array(z.string().trim().min(1))
    .min(2, 'Add at least 2 options')
    .max(10, 'Maximum 10 options allowed')
    .optional(),
  correctAnswer: z
    .string()
    .trim()
    .min(1, 'Correct answer is required'),
  explanation: z
    .string()
    .trim()
    .max(500, 'Explanation must be 500 characters or less')
    .optional(),
  order: z.number().int().min(0).optional(),
});

const createQuizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(140, 'Title must be 140 characters or less'),
  instructions: z
    .string()
    .trim()
    .max(1000, 'Instructions must be 1000 characters or less')
    .optional(),
  passingScore: z
    .number()
    .int()
    .min(0, 'Passing score must be at least 0')
    .max(100, 'Passing score must be at most 100')
    .optional()
    .default(70),
  lessonId: stringId.optional(),
  topicPageId: stringId.optional(),
  questions: z
    .array(questionSchema)
    .min(1, 'Add at least one question')
    .max(100, 'Maximum 100 questions per quiz'),
}).refine(
  (data) => data.lessonId || data.topicPageId,
  {
    message: 'Quiz must be linked to either a lesson or topic page',
    path: ['lessonId'],
  }
);

const submitAnswerSchema = z.object({
  questionId: stringId,
  selectedAnswer: z.string().trim().min(1, 'Answer is required'),
});

const submitQuizSchema = z.object({
  answers: z
    .array(submitAnswerSchema)
    .min(1, 'Submit at least one answer'),
});

module.exports = {
  quizParamsSchema,
  quizAttemptParamsSchema,
  createQuizSchema,
  submitAnswerSchema,
  submitQuizSchema,
  questionSchema,
};
