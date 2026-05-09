const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  flashcard: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  flashcardReview: {
    create: jest.fn(),
  },
  topicPage: {
    findUnique: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-flashcards';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';

const app = require('../../app');
const prisma = require('../../lib/prisma');
const { signAccessToken } = require('../auth/auth.tokens');

const learnerUser = {
  id: 'learner_1',
  email: 'learner@example.com',
  name: 'Learner User',
  role: 'LEARNER',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Flashcards routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves flashcards due for review', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.flashcard.findMany.mockResolvedValue([
      {
        id: 'flashcard_1',
        userId: learnerUser.id,
        frontText: 'What is a heading tag?',
        backText: '<h1>Heading</h1>',
        reviewCount: 1,
        intervalDays: 1,
        nextReviewAt: new Date('2026-05-07T09:00:00.000Z'),
        masteryScore: 20,
        topicPage: null,
        roadmapNode: null,
        createdAt: new Date('2026-05-06T00:00:00.000Z'),
        updatedAt: new Date('2026-05-06T00:00:00.000Z'),
      },
    ]);

    const response = await request(app)
      .get('/api/v1/flashcards/due?date=2026-05-07')
      .set('Authorization', authHeader(learnerUser))
      .expect(200);

    expect(response.body.data.flashcards).toHaveLength(1);
    expect(response.body.data.flashcards[0].frontText).toBe(
      'What is a heading tag?'
    );
  });

  it('creates a new flashcard from a topic block', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.topicPage.findUnique.mockResolvedValue({
      id: 'topic_1',
      title: 'HTML headings',
      status: 'PUBLISHED',
      roadmapNodeId: 'node_1',
      roadmapNode: { id: 'node_1' },
    });
    prisma.flashcard.create.mockResolvedValue({
      id: 'flashcard_2',
      userId: learnerUser.id,
      topicPageId: 'topic_1',
      roadmapNodeId: 'node_1',
      frontText: 'Heading — HTML headings',
      backText: 'From HTML headings',
      reviewCount: 0,
      reviewValueTotal: 0,
      intervalDays: 1,
      nextReviewAt: new Date('2026-05-08T00:00:00.000Z'),
      masteryScore: 0,
      topicPage: {
        id: 'topic_1',
        title: 'HTML headings',
        slug: 'html-headings',
      },
      roadmapNode: {
        id: 'node_1',
        title: 'HTML basics',
        slug: 'html-basics',
        roadmap: {
          id: 'roadmap_1',
          title: 'Frontend Fundamentals',
          slug: 'frontend-fundamentals',
        },
      },
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    });

    const expectedText = 'Heading — HTML headings';
    const response = await request(app)
      .post('/api/v1/flashcards')
      .set('Authorization', authHeader(learnerUser))
      .send({
        topicPageId: 'topic_1',
        frontText: expectedText,
        backText: 'From HTML headings',
      })
      .expect(201);

    expect(response.body.data.flashcard.frontText).toBe(expectedText);
  });

  it('reviews a flashcard and schedules next review', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.flashcard.findFirst.mockResolvedValue({
      id: 'flashcard_3',
      userId: learnerUser.id,
      intervalDays: 1,
      reviewCount: 2,
      reviewValueTotal: 4,
    });
    prisma.flashcard.update.mockResolvedValue({
      id: 'flashcard_3',
      userId: learnerUser.id,
      frontText: 'What is a paragraph tag?',
      backText: '<p>Paragraph</p>',
      reviewCount: 3,
      reviewValueTotal: 7,
      intervalDays: 2,
      nextReviewAt: new Date('2026-05-09T00:00:00.000Z'),
      masteryScore: 78,
      topicPage: null,
      roadmapNode: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
    });
    prisma.flashcardReview.create.mockResolvedValue({
      id: 'review_1',
      flashcardId: 'flashcard_3',
      userId: learnerUser.id,
      grade: 'GOOD',
      intervalDays: 2,
      nextReviewAt: new Date('2026-05-09T00:00:00.000Z'),
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/flashcards/flashcard_3/review')
      .set('Authorization', authHeader(learnerUser))
      .send({ grade: 'GOOD' })
      .expect(200);

    expect(response.body.data.flashcard.reviewCount).toBe(3);
    expect(response.body.data.flashcard.intervalDays).toBe(2);
  });
});
