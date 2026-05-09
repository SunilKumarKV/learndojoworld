const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  studyPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  studySession: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  revisionItem: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  flashcard: {
    findMany: jest.fn(),
  },
  learnerStats: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userRoadmapProgress: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  userNodeProgress: {
    findMany: jest.fn(),
  },
  roadmap: {
    findUnique: jest.fn(),
  },
  roadmapNode: {
    findUnique: jest.fn(),
  },
  topicPage: {
    findUnique: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-study-tracker';
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

const creatorUser = {
  id: 'creator_1',
  email: 'creator@example.com',
  name: 'Creator User',
  role: 'CREATOR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const roadmap = {
  id: 'roadmap_1',
  title: 'Frontend Fundamentals',
  slug: 'frontend-fundamentals',
  description: 'Learn frontend foundations',
  status: 'PUBLISHED',
};

const roadmapNode = {
  id: 'node_1',
  roadmapId: roadmap.id,
  title: 'HTML basics',
  slug: 'html-basics',
  summary: 'Learn semantic HTML',
  order: 0,
  roadmap,
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

function aggregateMinutes(minutes) {
  return {
    _sum: {
      durationMinutes: minutes,
    },
  };
}

describe('StudyTracker routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the learner StudyTracker dashboard', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.studyPlan.findMany.mockResolvedValue([
      {
        id: 'plan_1',
        userId: learnerUser.id,
        title: 'Continue HTML basics',
        description: 'Work through Frontend Fundamentals',
        plannedDate: new Date('2026-05-07T00:00:00.000Z'),
        estimatedMinutes: 30,
        status: 'PLANNED',
        completedAt: null,
        roadmap,
        roadmapNode,
        createdAt: new Date('2026-05-07T00:00:00.000Z'),
        updatedAt: new Date('2026-05-07T00:00:00.000Z'),
      },
    ]);
    prisma.userRoadmapProgress.findMany.mockResolvedValue([
      {
        id: 'progress_1',
        lastAccessedAt: new Date('2026-05-07T09:00:00.000Z'),
        roadmap: {
          ...roadmap,
          nodes: [
            {
              ...roadmapNode,
              userProgress: [
                {
                  roadmapNodeId: roadmapNode.id,
                  status: 'IN_PROGRESS',
                  startedAt: new Date('2026-05-07T09:00:00.000Z'),
                  completedAt: null,
                  needsRevisionAt: null,
                },
              ],
            },
          ],
        },
        nodeProgress: [
          {
            roadmapNodeId: roadmapNode.id,
            status: 'IN_PROGRESS',
            startedAt: new Date('2026-05-07T09:00:00.000Z'),
            completedAt: null,
            needsRevisionAt: null,
          },
        ],
      },
    ]);
    prisma.revisionItem.findMany.mockResolvedValue([
      {
        id: 'revision_1',
        title: 'Review HTML tags',
        reason: 'Low confidence',
        dueAt: new Date('2026-05-07T10:00:00.000Z'),
        confidence: 45,
        intervalDays: 1,
        status: 'DUE',
        completedAt: null,
        roadmapNode,
        topicPage: null,
        createdAt: new Date('2026-05-06T00:00:00.000Z'),
        updatedAt: new Date('2026-05-06T00:00:00.000Z'),
      },
    ]);
    prisma.userNodeProgress.findMany
      .mockResolvedValueOnce([
        {
          id: 'node_progress_1',
          status: 'NEEDS_REVISION',
          needsRevisionAt: new Date('2026-05-06T00:00:00.000Z'),
          updatedAt: new Date('2026-05-06T00:00:00.000Z'),
          roadmapNode: {
            ...roadmapNode,
            topicPages: [],
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          completedAt: new Date('2026-05-07T09:30:00.000Z'),
        },
      ]);
    prisma.studySession.findMany
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-05-07T09:00:00.000Z'),
          durationMinutes: 40,
        },
      ])
      .mockResolvedValueOnce([
        {
          startedAt: new Date('2026-05-07T09:00:00.000Z'),
        },
      ]);
    prisma.studySession.findFirst.mockResolvedValue(null);
    prisma.studySession.aggregate.mockResolvedValue(aggregateMinutes(40));
    prisma.flashcard.findMany.mockResolvedValue([]);
    prisma.learnerStats.findUnique.mockResolvedValue(null);
    prisma.learnerStats.create.mockResolvedValue({
      id: 'stats_1',
      userId: learnerUser.id,
      currentStreak: 1,
      longestStreak: 1,
      totalStudyMinutes: 40,
      lastStudiedAt: new Date('2026-05-07T09:00:00.000Z'),
    });

    const response = await request(app)
      .get('/api/v1/study-tracker/dashboard?date=2026-05-07')
      .set('Authorization', authHeader(learnerUser))
      .expect(200);

    expect(response.body.data.today.plan[0]).toMatchObject({
      title: 'Continue HTML basics',
      status: 'PLANNED',
    });
    expect(response.body.data.continueLearning[0].nextNode.title).toBe(
      'HTML basics'
    );
    expect(response.body.data.revisionDue[0].title).toBe('Review HTML tags');
    expect(response.body.data.weakTopics[0].roadmapNode.title).toBe(
      'HTML basics'
    );
    expect(response.body.data.streak.current).toBe(1);
    expect(response.body.data.studyTime.weekMinutes).toBe(40);
  });

  it('blocks creator accounts from learner StudyTracker routes', async () => {
    mockAuthenticatedUser(creatorUser);

    const response = await request(app)
      .get('/api/v1/study-tracker/dashboard')
      .set('Authorization', authHeader(creatorUser))
      .expect(403);

    expect(response.body.message).toContain('permission');
    expect(prisma.studyPlan.findMany).not.toHaveBeenCalled();
  });

  it('starts learner study sessions for published roadmap nodes', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.studySession.findFirst.mockResolvedValue(null);
    prisma.roadmapNode.findUnique.mockResolvedValue(roadmapNode);
    prisma.studySession.create.mockResolvedValue({
      id: 'session_1',
      userId: learnerUser.id,
      roadmapId: roadmap.id,
      roadmapNodeId: roadmapNode.id,
      topicPageId: null,
      title: 'Study HTML basics',
      startedAt: new Date('2026-05-07T09:00:00.000Z'),
      endedAt: null,
      durationMinutes: null,
      status: 'ACTIVE',
      roadmap,
      roadmapNode,
      topicPage: null,
      createdAt: new Date('2026-05-07T09:00:00.000Z'),
      updatedAt: new Date('2026-05-07T09:00:00.000Z'),
    });
    prisma.userRoadmapProgress.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .post('/api/v1/study-tracker/sessions')
      .set('Authorization', authHeader(learnerUser))
      .send({
        title: 'Study HTML basics',
        roadmapNodeId: roadmapNode.id,
      })
      .expect(201);

    expect(response.body.data.session).toMatchObject({
      title: 'Study HTML basics',
      status: 'ACTIVE',
    });
    expect(prisma.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: learnerUser.id,
          roadmapId: roadmap.id,
          roadmapNodeId: roadmapNode.id,
        }),
      })
    );
  });

  it('completes active study sessions and updates learner stats', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.studySession.findFirst.mockResolvedValue({
      id: 'session_1',
      userId: learnerUser.id,
      startedAt: new Date('2026-05-07T09:00:00.000Z'),
      status: 'ACTIVE',
    });
    prisma.studySession.update.mockResolvedValue({
      id: 'session_1',
      title: 'Study HTML basics',
      startedAt: new Date('2026-05-07T09:00:00.000Z'),
      endedAt: new Date('2026-05-07T09:40:00.000Z'),
      durationMinutes: 40,
      status: 'COMPLETED',
      roadmap,
      roadmapNode,
      topicPage: null,
      createdAt: new Date('2026-05-07T09:00:00.000Z'),
      updatedAt: new Date('2026-05-07T09:40:00.000Z'),
    });
    prisma.studySession.findMany.mockResolvedValue([
      {
        startedAt: new Date('2026-05-07T09:00:00.000Z'),
      },
    ]);
    prisma.studySession.aggregate.mockResolvedValue(aggregateMinutes(40));
    prisma.learnerStats.findUnique.mockResolvedValue(null);
    prisma.learnerStats.create.mockResolvedValue({
      id: 'stats_1',
      userId: learnerUser.id,
      currentStreak: 1,
      longestStreak: 1,
      totalStudyMinutes: 40,
      lastStudiedAt: new Date('2026-05-07T09:00:00.000Z'),
    });

    const response = await request(app)
      .patch('/api/v1/study-tracker/sessions/session_1/complete')
      .set('Authorization', authHeader(learnerUser))
      .send({ durationMinutes: 40 })
      .expect(200);

    expect(response.body.data.session).toMatchObject({
      id: 'session_1',
      durationMinutes: 40,
      status: 'COMPLETED',
    });
    expect(response.body.data.stats).toMatchObject({
      currentStreak: 1,
      totalStudyMinutes: 40,
    });
  });
});
