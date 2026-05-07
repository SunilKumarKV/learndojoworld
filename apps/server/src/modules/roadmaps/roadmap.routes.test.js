const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  roadmap: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  roadmapNode: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  userRoadmapProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userNodeProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-roadmap-routes';
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

const roadmap = {
  id: 'roadmap_1',
  title: 'Frontend Fundamentals',
  slug: 'frontend-fundamentals',
  description: 'Learn frontend foundations',
  status: 'PUBLISHED',
  createdBy: creatorUser,
  nodes: [],
  learnerProgress: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Roadmap routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows creators to create roadmaps', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.roadmap.findUnique.mockResolvedValue(null);
    prisma.roadmap.create.mockResolvedValue({
      ...roadmap,
      title: 'Frontend Fundamentals',
      nodes: [],
      learnerProgress: [],
    });

    const response = await request(app)
      .post('/api/v1/roadmaps')
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'Frontend Fundamentals',
        description: 'Learn frontend foundations',
      })
      .expect(201);

    expect(response.body.data.roadmap).toMatchObject({
      title: 'Frontend Fundamentals',
      slug: 'frontend-fundamentals',
      progressPercentage: 0,
    });
    expect(prisma.roadmap.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: creatorUser.id,
          status: 'PUBLISHED',
        }),
      })
    );
  });

  it('blocks learners from creating roadmaps', async () => {
    mockAuthenticatedUser(learnerUser);

    const response = await request(app)
      .post('/api/v1/roadmaps')
      .set('Authorization', authHeader(learnerUser))
      .send({ title: 'Backend Fundamentals' })
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to access this resource'
    );
    expect(prisma.roadmap.create).not.toHaveBeenCalled();
  });

  it('allows creators to add roadmap nodes', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.roadmap.findUnique.mockResolvedValue({ id: roadmap.id });
    prisma.roadmapNode.findUnique.mockResolvedValue(null);
    prisma.roadmapNode.findFirst.mockResolvedValue({ order: 1 });
    prisma.roadmapNode.create.mockResolvedValue({
      id: 'node_1',
      roadmapId: roadmap.id,
      title: 'HTML basics',
      slug: 'html-basics',
      summary: 'Learn semantic HTML',
      content: 'HTML content',
      order: 2,
      prerequisites: [],
      unlocks: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post(`/api/v1/roadmaps/${roadmap.id}/nodes`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'HTML basics',
        summary: 'Learn semantic HTML',
        content: 'HTML content',
      })
      .expect(201);

    expect(response.body.data.node).toMatchObject({
      title: 'HTML basics',
      order: 2,
    });
  });

  it('adds prerequisites between nodes in the same roadmap', async () => {
    mockAuthenticatedUser(creatorUser);
    const targetNode = {
      id: 'node_2',
      roadmapId: roadmap.id,
      prerequisites: [],
    };
    const prerequisiteNode = {
      id: 'node_1',
      roadmapId: roadmap.id,
      prerequisites: [],
    };
    prisma.roadmapNode.findMany
      .mockResolvedValueOnce([targetNode, prerequisiteNode])
      .mockResolvedValueOnce([targetNode, prerequisiteNode]);
    prisma.roadmapNode.update.mockResolvedValue({
      ...targetNode,
      title: 'CSS basics',
      slug: 'css-basics',
      summary: null,
      content: null,
      order: 1,
      prerequisites: [
        {
          id: prerequisiteNode.id,
          title: 'HTML basics',
          slug: 'html-basics',
          summary: null,
          order: 0,
        },
      ],
      unlocks: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post(`/api/v1/roadmaps/${roadmap.id}/nodes/node_2/prerequisites`)
      .set('Authorization', authHeader(creatorUser))
      .send({ prerequisiteNodeIds: [prerequisiteNode.id] })
      .expect(200);

    expect(response.body.data.node.prerequisites).toHaveLength(1);
    expect(prisma.roadmapNode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          prerequisites: {
            connect: [{ id: prerequisiteNode.id }],
          },
        },
      })
    );
  });

  it('allows learners to start roadmaps', async () => {
    mockAuthenticatedUser(learnerUser);
    const nodes = [{ id: 'node_1' }, { id: 'node_2' }];
    prisma.roadmap.findUnique.mockResolvedValue({
      ...roadmap,
      nodes,
    });
    prisma.userRoadmapProgress.findUnique.mockResolvedValue(null);
    prisma.userRoadmapProgress.create.mockResolvedValue({
      id: 'progress_1',
      userId: learnerUser.id,
      roadmapId: roadmap.id,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
      lastAccessedAt: new Date('2026-01-01T00:00:00.000Z'),
      roadmap: { nodes },
      nodeProgress: [
        { roadmapNodeId: 'node_1', status: 'NOT_STARTED' },
        { roadmapNodeId: 'node_2', status: 'NOT_STARTED' },
      ],
    });

    const response = await request(app)
      .post(`/api/v1/roadmaps/${roadmap.id}/start`)
      .set('Authorization', authHeader(learnerUser))
      .send({})
      .expect(201);

    expect(response.body.data.progress).toMatchObject({
      totalNodes: 2,
      completedNodes: 0,
      progressPercentage: 0,
    });
  });

  it('updates node progress and calculates percentage', async () => {
    mockAuthenticatedUser(learnerUser);
    prisma.userRoadmapProgress.findUnique.mockResolvedValue({
      id: 'progress_1',
      userId: learnerUser.id,
      roadmapId: roadmap.id,
    });
    prisma.roadmapNode.findUnique.mockResolvedValue({
      id: 'node_1',
      roadmapId: roadmap.id,
      prerequisites: [],
    });
    prisma.userNodeProgress.findUnique.mockResolvedValue({
      id: 'node_progress_1',
      userId: learnerUser.id,
      roadmapNodeId: 'node_1',
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.userNodeProgress.update.mockResolvedValue({
      id: 'node_progress_1',
      roadmapNodeId: 'node_1',
      status: 'COMPLETED',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-02T00:00:00.000Z'),
      needsRevisionAt: null,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    prisma.roadmapNode.count.mockResolvedValue(2);
    prisma.userNodeProgress.count.mockResolvedValue(1);
    prisma.userRoadmapProgress.update.mockResolvedValue({
      id: 'progress_1',
      userId: learnerUser.id,
      roadmapId: roadmap.id,
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: null,
      lastAccessedAt: new Date('2026-01-02T00:00:00.000Z'),
      roadmap: { nodes: [{ id: 'node_1' }, { id: 'node_2' }] },
      nodeProgress: [{ roadmapNodeId: 'node_1', status: 'COMPLETED' }],
    });

    const response = await request(app)
      .patch(`/api/v1/roadmaps/${roadmap.id}/nodes/node_1/progress`)
      .set('Authorization', authHeader(learnerUser))
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(response.body.data.progress).toMatchObject({
      totalNodes: 2,
      completedNodes: 1,
      progressPercentage: 50,
    });
  });
});
