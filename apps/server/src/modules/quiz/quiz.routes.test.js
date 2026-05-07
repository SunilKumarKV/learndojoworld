const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  quiz: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  quizQuestion: {
    findUnique: jest.fn(),
  },
  quizAttempt: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  quizAnswer: {
    upsert: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
  },
  topicPage: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  topicPageQuiz: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userNodeProgress: {
    upsert: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-quiz';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';

const app = require('../../app');
const prisma = require('../../lib/prisma');
const { signAccessToken } = require('../auth/auth.tokens');

const creatorUser = {
  id: 'creator_1',
  email: 'creator@example.com',
  name: 'Creator User',
  role: 'CREATOR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const learnerUser = {
  id: 'learner_1',
  email: 'learner@example.com',
  name: 'Learner User',
  role: 'LEARNER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const baseQuiz = {
  id: 'quiz_1',
  title: 'HTML Basics Quiz',
  instructions: 'Answer all questions correctly',
  passingScore: 70,
  lessonId: 'lesson_1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const questions = [
  {
    id: 'q1',
    quizId: 'quiz_1',
    prompt: 'What does HTML stand for?',
    type: 'MULTIPLE_CHOICE',
    options: [
      'Hyper Text Markup Language',
      'Home Tool Markup Language',
      'Hyperlinks and Text Markup Language',
    ],
    correctAnswer: 'Hyper Text Markup Language',
    explanation: 'HTML stands for Hyper Text Markup Language',
    order: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
];

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Quiz routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks learners from creating quizzes', async () => {
    mockAuthenticatedUser(learnerUser);

    const response = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', authHeader(learnerUser))
      .send({
        title: 'HTML Basics Quiz',
        lessonId: 'lesson_1',
        questions: [
          {
            prompt: 'What is HTML?',
            type: 'MULTIPLE_CHOICE',
            options: ['A', 'B'],
            correctAnswer: 'A',
          },
        ],
      })
      .expect(403);

    expect(response.body.message).toContain('permission');
  });

  it('requires authentication for all quiz endpoints', async () => {
    const response = await request(app)
      .get('/api/v1/quizzes/quiz_1')
      .expect(401);

    expect(response.body.message).toContain('required');
  });

  it('allows creators to attempt quizzes (learner attempt)', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.quiz.findUnique.mockResolvedValue({
      id: 'quiz_1',
      questions: [questions[0]],
    });
    prisma.quizAttempt.create.mockResolvedValue({
      id: 'attempt_1',
      quizId: 'quiz_1',
      userId: learnerUser.id,
      score: 0,
      totalQuestions: 1,
      timeTakenSeconds: null,
      createdAt: new Date(),
    });
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: 'attempt_1',
      quizId: 'quiz_1',
      userId: learnerUser.id,
      score: 0,
      totalQuestions: 1,
      timeTakenSeconds: null,
      createdAt: new Date(),
      answers: [],
      quiz: { id: 'quiz_1', passingScore: 70, lesson: { id: 'lesson_1' } },
    });

    const response = await request(app)
      .post('/api/v1/quizzes/quiz_1/attempts')
      .set('Authorization', authHeader(learnerUser))
      .expect(201);

    expect(response.body.data.attempt).toMatchObject({
      quizId: 'quiz_1',
      totalQuestions: 1,
    });
  });

  it('allows learners to submit answers', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: 'attempt_1',
      userId: learnerUser.id,
      quizId: 'quiz_1',
    });
    prisma.quizQuestion.findUnique.mockResolvedValue({
      id: 'q1',
      quizId: 'quiz_1',
      type: 'MULTIPLE_CHOICE',
      correctAnswer: 'Hyper Text Markup Language',
    });
    prisma.quizAnswer.upsert.mockResolvedValue({
      id: 'answer_1',
      selectedAnswer: 'Hyper Text Markup Language',
      isCorrect: true,
    });

    const response = await request(app)
      .post('/api/v1/quizzes/quiz_1/attempts/attempt_1/answers')
      .set('Authorization', authHeader(learnerUser))
      .send({
        questionId: 'q1',
        selectedAnswer: 'Hyper Text Markup Language',
      })
      .expect(200);

    expect(response.body.data.answer).toMatchObject({
      isCorrect: true,
    });
  });
});
