const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  $transaction: jest.fn(),
  user: {
    findUnique: jest.fn(),
  },
  roadmapNode: {
    findUnique: jest.fn(),
  },
  topicPage: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contentBlock: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  contentReviewEvent: {
    create: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-topic-routes';
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

const adminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
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

const baseTopic = {
  id: 'topic_1',
  title: 'HTML Introduction',
  slug: 'html-introduction',
  summary: 'Learn the purpose of HTML',
  status: 'DRAFT',
  roadmapNodeId: 'node_1',
  createdById: creatorUser.id,
  approvedById: null,
  reviewNotes: null,
  submittedAt: null,
  approvedAt: null,
  publishedAt: null,
  createdBy: creatorUser,
  approvedBy: null,
  roadmapNode: {
    id: 'node_1',
    title: 'HTML basics',
    slug: 'html-basics',
    roadmapId: 'roadmap_1',
  },
  blocks: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const paragraphBlock = {
  id: 'block_1',
  topicPageId: baseTopic.id,
  type: 'PARAGRAPH',
  title: null,
  content: 'HTML structures web pages.',
  language: null,
  referenceId: null,
  order: 0,
  metadata: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Topic routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operations) =>
      Promise.all(operations)
    );
  });

  it('allows creators to create topic pages linked to roadmap nodes', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.roadmapNode.findUnique.mockResolvedValue({ id: 'node_1' });
    prisma.topicPage.findUnique.mockResolvedValue(null);
    prisma.topicPage.create.mockResolvedValue({
      ...baseTopic,
      status: 'SUBMITTED',
    });

    const response = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'HTML Introduction',
        summary: 'Learn the purpose of HTML',
        roadmapNodeId: 'node_1',
        status: 'SUBMITTED',
      })
      .expect(201);

    expect(response.body.data.topic).toMatchObject({
      title: 'HTML Introduction',
      slug: 'html-introduction',
      status: 'SUBMITTED',
      roadmapNode: { id: 'node_1' },
    });
    expect(prisma.topicPage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: creatorUser.id,
          roadmapNodeId: 'node_1',
        }),
      })
    );
  });

  it('blocks learners from creating topic pages', async () => {
    mockAuthenticatedUser(learnerUser);

    const response = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', authHeader(learnerUser))
      .send({ title: 'HTML Introduction' })
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to access this resource'
    );
    expect(prisma.topicPage.create).not.toHaveBeenCalled();
  });

  it('adds block-based content to a topic', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.topicPage.findUnique.mockResolvedValue({
      ...baseTopic,
      blocks: [],
    });
    prisma.contentBlock.findFirst.mockResolvedValue(null);
    prisma.contentBlock.create.mockResolvedValue(paragraphBlock);

    const response = await request(app)
      .post(`/api/v1/topics/${baseTopic.id}/blocks`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        blocks: [
          {
            type: 'PARAGRAPH',
            content: 'HTML structures web pages.',
          },
        ],
      })
      .expect(201);

    expect(response.body.data.blocks).toHaveLength(1);
    expect(prisma.contentBlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topicPageId: baseTopic.id,
        type: 'PARAGRAPH',
      }),
    });
  });

  it('allows admins to approve submitted topics', async () => {
    mockAuthenticatedUser(adminUser);
    prisma.topicPage.findUnique.mockResolvedValue({
      ...baseTopic,
      status: 'SUBMITTED',
      blocks: [paragraphBlock],
    });
    prisma.topicPage.update.mockResolvedValue({
      ...baseTopic,
      status: 'APPROVED',
      approvedById: adminUser.id,
      approvedBy: adminUser,
      approvedAt: new Date('2026-01-02T00:00:00.000Z'),
      publishedAt: null,
      blocks: [paragraphBlock],
    });

    const response = await request(app)
      .post(`/api/v1/topics/${baseTopic.id}/approve`)
      .set('Authorization', authHeader(adminUser))
      .send({})
      .expect(200);

    expect(response.body.data.topic).toMatchObject({
      status: 'APPROVED',
      approvedBy: { id: adminUser.id },
    });
  });

  it('hides unapproved topics from learners', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.topicPage.findUnique.mockResolvedValue({
      ...baseTopic,
      status: 'SUBMITTED',
      blocks: [paragraphBlock],
    });

    const response = await request(app)
      .get(`/api/v1/topics/${baseTopic.id}`)
      .set('Authorization', authHeader(learnerUser))
      .expect(404);

    expect(response.body.message).toBe('Topic not found');
  });

  it('lists only admin-approved published topics for learners', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.topicPage.findMany.mockResolvedValue([
      {
        ...baseTopic,
        status: 'PUBLISHED',
        approvedById: adminUser.id,
        approvedBy: adminUser,
        approvedAt: new Date('2026-01-02T00:00:00.000Z'),
        publishedAt: new Date('2026-01-02T00:00:00.000Z'),
        blocks: [{ id: paragraphBlock.id }],
      },
    ]);

    const response = await request(app)
      .get('/api/v1/topics')
      .set('Authorization', authHeader(learnerUser))
      .expect(200);

    expect(response.body.data.topics).toHaveLength(1);
    expect(prisma.topicPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PUBLISHED',
          approvedAt: { not: null },
          approvedById: { not: null },
        }),
      })
    );
  });
});
