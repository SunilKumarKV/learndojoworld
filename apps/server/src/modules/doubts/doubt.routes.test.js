const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  topicPage: {
    findUnique: jest.fn(),
  },
  roadmapNode: {
    findUnique: jest.fn(),
  },
  doubt: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  doubtReply: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  doubtVote: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  doubtReport: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-doubts';
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

const secondLearner = {
  id: 'learner_2',
  email: 'helper@example.com',
  name: 'Helpful Learner',
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

const adminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const roadmap = {
  id: 'roadmap_1',
  title: 'Frontend Fundamentals',
  slug: 'frontend-fundamentals',
  status: 'PUBLISHED',
  createdById: creatorUser.id,
};

const roadmapNode = {
  id: 'node_1',
  title: 'HTML basics',
  slug: 'html-basics',
  roadmapId: roadmap.id,
  roadmap,
};

const topicPage = {
  id: 'topic_1',
  title: 'Semantic HTML',
  slug: 'semantic-html',
  status: 'PUBLISHED',
  approvedAt: new Date('2026-01-01T00:00:00.000Z'),
  approvedById: adminUser.id,
  createdById: creatorUser.id,
  roadmapNodeId: roadmapNode.id,
  roadmapNode,
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

function doubtRecord(overrides = {}) {
  return {
    id: 'doubt_1',
    title: 'Why use semantic HTML?',
    content: 'I do not understand when to choose section over div.',
    status: 'OPEN',
    topicPage,
    roadmapNode,
    topicPageId: topicPage.id,
    roadmapNodeId: roadmapNode.id,
    videoTimestampSeconds: 95,
    authorId: learnerUser.id,
    author: learnerUser,
    acceptedReplyId: null,
    moderationReason: null,
    votes: [],
    replies: [],
    _count: {
      votes: 2,
      reports: 0,
      replies: 0,
    },
    createdAt: new Date('2026-05-07T10:00:00.000Z'),
    updatedAt: new Date('2026-05-07T10:00:00.000Z'),
    ...overrides,
  };
}

function replyRecord(overrides = {}) {
  return {
    id: 'reply_1',
    doubtId: 'doubt_1',
    authorId: secondLearner.id,
    author: secondLearner,
    content: 'Use section when the content has a meaningful heading.',
    isOfficial: false,
    officialMarkedBy: null,
    officialMarkedAt: null,
    isHidden: false,
    moderationReason: null,
    votes: [],
    _count: {
      votes: 1,
      reports: 0,
    },
    createdAt: new Date('2026-05-07T10:10:00.000Z'),
    updatedAt: new Date('2026-05-07T10:10:00.000Z'),
    ...overrides,
  };
}

describe('Doubt routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists topic doubts with official and accepted answer metadata', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.doubt.findMany.mockResolvedValue([
      doubtRecord({
        acceptedReplyId: 'reply_1',
        replies: [
          replyRecord({
            isOfficial: true,
            officialMarkedBy: creatorUser,
          }),
        ],
      }),
    ]);

    const response = await request(app)
      .get('/api/v1/doubts?topicPageId=topic_1')
      .set('Authorization', authHeader(learnerUser))
      .expect(200);

    expect(response.body.data.doubts[0]).toMatchObject({
      title: 'Why use semantic HTML?',
      upvoteCount: 2,
      videoTimestampSeconds: 95,
    });
    expect(response.body.data.doubts[0].replies[0]).toMatchObject({
      isOfficial: true,
      isAccepted: true,
    });
  });

  it('allows learners to ask a doubt on a topic and linked node', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.topicPage.findUnique.mockResolvedValue(topicPage);
    prisma.roadmapNode.findUnique.mockResolvedValue(roadmapNode);
    prisma.doubt.create.mockResolvedValue(doubtRecord());

    const response = await request(app)
      .post('/api/v1/doubts')
      .set('Authorization', authHeader(learnerUser))
      .send({
        title: 'Why use semantic HTML?',
        content: 'I do not understand when to choose section over div.',
        topicPageId: topicPage.id,
        roadmapNodeId: roadmapNode.id,
        videoTimestampSeconds: 95,
      })
      .expect(201);

    expect(response.body.data.doubt).toMatchObject({
      title: 'Why use semantic HTML?',
      roadmapNode: expect.objectContaining({ id: roadmapNode.id }),
    });
    expect(prisma.doubt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: learnerUser.id,
          topicPageId: topicPage.id,
          roadmapNodeId: roadmapNode.id,
        }),
      })
    );
  });

  it('allows another learner to reply to a doubt', async () => {
    mockAuthenticatedUser(secondLearner);
    prisma.doubt.findUnique.mockResolvedValue(doubtRecord());
    prisma.doubtReply.create.mockResolvedValue(replyRecord());

    const response = await request(app)
      .post('/api/v1/doubts/doubt_1/replies')
      .set('Authorization', authHeader(secondLearner))
      .send({
        content: 'Use section when the content has a meaningful heading.',
      })
      .expect(201);

    expect(response.body.data.reply).toMatchObject({
      content: 'Use section when the content has a meaningful heading.',
      author: expect.objectContaining({ id: secondLearner.id }),
    });
  });

  it('allows the creator to mark an official answer', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.doubt.findUnique.mockResolvedValue(doubtRecord());
    prisma.doubtReply.findFirst.mockResolvedValue(replyRecord());
    prisma.doubtReply.updateMany.mockResolvedValue({ count: 1 });
    prisma.doubtReply.update.mockResolvedValue(
      replyRecord({
        isOfficial: true,
        officialMarkedBy: creatorUser,
        officialMarkedAt: new Date('2026-05-07T10:20:00.000Z'),
      })
    );

    const response = await request(app)
      .post('/api/v1/doubts/doubt_1/replies/reply_1/official')
      .set('Authorization', authHeader(creatorUser))
      .send({})
      .expect(200);

    expect(response.body.data.reply).toMatchObject({
      isOfficial: true,
      officialMarkedBy: expect.objectContaining({ id: creatorUser.id }),
    });
    expect(prisma.doubtReply.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { doubtId: 'doubt_1' },
      })
    );
  });

  it('allows the doubt author to accept an answer', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.doubt.findUnique.mockResolvedValue(doubtRecord());
    prisma.doubtReply.findFirst.mockResolvedValue(replyRecord());
    prisma.doubt.update.mockResolvedValue(
      doubtRecord({
        status: 'RESOLVED',
        acceptedReplyId: 'reply_1',
        replies: [replyRecord()],
      })
    );

    const response = await request(app)
      .post('/api/v1/doubts/doubt_1/replies/reply_1/accept')
      .set('Authorization', authHeader(learnerUser))
      .send({})
      .expect(200);

    expect(response.body.data.doubt).toMatchObject({
      status: 'RESOLVED',
      acceptedReplyId: 'reply_1',
    });
    expect(response.body.data.doubt.replies[0].isAccepted).toBe(true);
  });

  it('toggles upvotes and reports doubts', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.doubt.findUnique.mockResolvedValue(doubtRecord());
    prisma.doubtVote.findFirst.mockResolvedValue(null);
    prisma.doubtVote.create.mockResolvedValue({
      id: 'vote_1',
      userId: learnerUser.id,
      doubtId: 'doubt_1',
    });
    prisma.doubtVote.count.mockResolvedValue(3);
    prisma.doubtReport.findFirst.mockResolvedValue(null);
    prisma.doubtReport.create.mockResolvedValue({
      id: 'report_1',
      reason: 'Spam or abusive content',
      status: 'PENDING',
      reporter: learnerUser,
      reviewedBy: null,
      reviewedAt: null,
      resolutionNotes: null,
      doubt: doubtRecord(),
      reply: null,
      createdAt: new Date('2026-05-07T10:30:00.000Z'),
      updatedAt: new Date('2026-05-07T10:30:00.000Z'),
    });

    const voteResponse = await request(app)
      .post('/api/v1/doubts/doubt_1/upvote')
      .set('Authorization', authHeader(learnerUser))
      .send({})
      .expect(200);

    const reportResponse = await request(app)
      .post('/api/v1/doubts/doubt_1/report')
      .set('Authorization', authHeader(learnerUser))
      .send({ reason: 'Spam or abusive content' })
      .expect(201);

    expect(voteResponse.body.data.vote).toMatchObject({
      hasUpvoted: true,
      upvoteCount: 3,
    });
    expect(reportResponse.body.data.report).toMatchObject({
      status: 'PENDING',
      reason: 'Spam or abusive content',
    });
  });

  it('allows admins to moderate doubts and review reports', async () => {
    mockAuthenticatedUser(adminUser);
    prisma.doubt.findUnique.mockResolvedValue({ id: 'doubt_1' });
    prisma.doubt.update.mockResolvedValue(
      doubtRecord({
        status: 'HIDDEN',
        moderationReason: 'Contains personal information',
      })
    );
    prisma.doubtReport.findUnique.mockResolvedValue({ id: 'report_1' });
    prisma.doubtReport.update.mockResolvedValue({
      id: 'report_1',
      reason: 'Contains personal information',
      status: 'ACTIONED',
      reporter: learnerUser,
      reviewedBy: adminUser,
      reviewedAt: new Date('2026-05-07T10:40:00.000Z'),
      resolutionNotes: 'Doubt hidden',
      doubt: doubtRecord({ status: 'HIDDEN' }),
      reply: null,
      createdAt: new Date('2026-05-07T10:30:00.000Z'),
      updatedAt: new Date('2026-05-07T10:40:00.000Z'),
    });

    const moderationResponse = await request(app)
      .patch('/api/v1/doubts/moderation/doubts/doubt_1')
      .set('Authorization', authHeader(adminUser))
      .send({
        status: 'HIDDEN',
        moderationReason: 'Contains personal information',
      })
      .expect(200);

    const reportResponse = await request(app)
      .patch('/api/v1/doubts/moderation/reports/report_1')
      .set('Authorization', authHeader(adminUser))
      .send({
        status: 'ACTIONED',
        resolutionNotes: 'Doubt hidden',
      })
      .expect(200);

    expect(moderationResponse.body.data.doubt).toMatchObject({
      status: 'HIDDEN',
      moderationReason: 'Contains personal information',
    });
    expect(reportResponse.body.data.report).toMatchObject({
      status: 'ACTIONED',
      resolutionNotes: 'Doubt hidden',
    });
  });
});
