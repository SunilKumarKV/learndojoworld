const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  topicPage: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  contentReviewEvent: {
    create: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-admin-review';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';

const app = require('../../app');
const prisma = require('../../lib/prisma');
const { signAccessToken } = require('../auth/auth.tokens');

const adminUser = {
  id: 'admin_1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
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

const submittedCourse = {
  id: 'course_1',
  title: 'Frontend Foundations',
  slug: 'frontend-foundations',
  subtitle: 'HTML to React',
  description: 'Build frontend skills',
  level: 'Beginner',
  status: 'SUBMITTED',
  reviewNotes: null,
  submittedAt: new Date('2026-01-02T00:00:00.000Z'),
  approvedAt: null,
  publishedAt: null,
  createdById: creatorUser.id,
  createdBy: creatorUser,
  approvedById: null,
  approvedBy: null,
  modules: [
    {
      id: 'module_1',
      title: 'HTML basics',
      summary: 'Structure web pages',
      order: 0,
      lessons: [
        {
          id: 'lesson_1',
          title: 'Create your first page',
          summary: 'Use semantic HTML',
          videoUrl: 'https://video.example.com/html',
          order: 0,
          topicPage: null,
          notes: [
            {
              id: 'note_1',
              type: 'PARAGRAPH',
              content: 'HTML structures pages.',
              order: 0,
            },
          ],
          quiz: null,
        },
      ],
    },
  ],
  reviewEvents: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const submittedTopic = {
  id: 'topic_1',
  title: 'HTML Introduction',
  slug: 'html-introduction',
  summary: 'Learn HTML',
  status: 'SUBMITTED',
  reviewNotes: null,
  submittedAt: new Date('2026-01-02T00:00:00.000Z'),
  approvedAt: null,
  publishedAt: null,
  createdById: creatorUser.id,
  createdBy: creatorUser,
  approvedById: null,
  approvedBy: null,
  roadmapNode: null,
  blocks: [
    {
      id: 'block_1',
      type: 'PARAGRAPH',
      content: 'HTML gives pages structure.',
      order: 0,
    },
  ],
  reviewEvents: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Admin review routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists submitted courses and topic pages in the review queue', async () => {
    mockAuthenticatedUser(adminUser);
    prisma.course.findMany.mockResolvedValue([submittedCourse]);
    prisma.topicPage.findMany.mockResolvedValue([submittedTopic]);

    const response = await request(app)
      .get('/api/v1/admin/review/queue')
      .set('Authorization', authHeader(adminUser))
      .expect(200);

    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0]).toMatchObject({
      title: 'Frontend Foundations',
      status: 'SUBMITTED',
      creator: { id: creatorUser.id },
    });
  });

  it('blocks non-admin users from the review queue', async () => {
    mockAuthenticatedUser(creatorUser);

    const response = await request(app)
      .get('/api/v1/admin/review/queue')
      .set('Authorization', authHeader(creatorUser))
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to access this resource'
    );
  });

  it('previews content with a status timeline', async () => {
    mockAuthenticatedUser(adminUser);
    prisma.course.findUnique.mockResolvedValue(submittedCourse);

    const response = await request(app)
      .get(`/api/v1/admin/review/content/course/${submittedCourse.id}`)
      .set('Authorization', authHeader(adminUser))
      .expect(200);

    expect(response.body.data.item).toMatchObject({
      title: 'Frontend Foundations',
      contentType: 'COURSE',
    });
    expect(response.body.data.timeline[0]).toMatchObject({
      toStatus: 'DRAFT',
    });
  });

  it('approves and publishes submitted content with review events', async () => {
    mockAuthenticatedUser(adminUser);
    const approvedCourse = {
      ...submittedCourse,
      status: 'APPROVED',
      approvedById: adminUser.id,
      approvedBy: adminUser,
      approvedAt: new Date('2026-01-03T00:00:00.000Z'),
      reviewEvents: [
        {
          id: 'event_1',
          fromStatus: 'SUBMITTED',
          toStatus: 'APPROVED',
          reason: null,
          actor: adminUser,
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        },
      ],
    };
    const publishedCourse = {
      ...approvedCourse,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-01-04T00:00:00.000Z'),
      reviewEvents: [
        ...approvedCourse.reviewEvents,
        {
          id: 'event_2',
          fromStatus: 'APPROVED',
          toStatus: 'PUBLISHED',
          reason: null,
          actor: adminUser,
          createdAt: new Date('2026-01-04T00:00:00.000Z'),
        },
      ],
    };
    prisma.course.findUnique
      .mockResolvedValueOnce(submittedCourse)
      .mockResolvedValueOnce(approvedCourse)
      .mockResolvedValueOnce(approvedCourse)
      .mockResolvedValueOnce(publishedCourse);
    prisma.course.update.mockResolvedValue(approvedCourse);
    prisma.contentReviewEvent.create.mockResolvedValue({});

    const approveResponse = await request(app)
      .post(`/api/v1/admin/review/content/course/${submittedCourse.id}/approve`)
      .set('Authorization', authHeader(adminUser))
      .send({})
      .expect(200);

    const publishResponse = await request(app)
      .post(`/api/v1/admin/review/content/course/${submittedCourse.id}/publish`)
      .set('Authorization', authHeader(adminUser))
      .send({})
      .expect(200);

    expect(approveResponse.body.data.item.status).toBe('APPROVED');
    expect(publishResponse.body.data.item.status).toBe('PUBLISHED');
    expect(prisma.contentReviewEvent.create).toHaveBeenCalledTimes(2);
  });

  it('rejects topic pages with a reason', async () => {
    mockAuthenticatedUser(adminUser);
    const rejectedTopic = {
      ...submittedTopic,
      status: 'REJECTED',
      reviewNotes: 'Add a real-world example.',
      reviewEvents: [
        {
          id: 'event_1',
          fromStatus: 'SUBMITTED',
          toStatus: 'REJECTED',
          reason: 'Add a real-world example.',
          actor: adminUser,
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        },
      ],
    };
    prisma.topicPage.findUnique
      .mockResolvedValueOnce(submittedTopic)
      .mockResolvedValueOnce(rejectedTopic);
    prisma.topicPage.update.mockResolvedValue(rejectedTopic);
    prisma.contentReviewEvent.create.mockResolvedValue({});

    const response = await request(app)
      .post(`/api/v1/admin/review/content/topic/${submittedTopic.id}/reject`)
      .set('Authorization', authHeader(adminUser))
      .send({ reason: 'Add a real-world example.' })
      .expect(200);

    expect(response.body.data.item).toMatchObject({
      status: 'REJECTED',
      reviewNotes: 'Add a real-world example.',
    });
  });

  it('lists creators with content counts', async () => {
    mockAuthenticatedUser(adminUser);
    prisma.user.findMany.mockResolvedValue([
      {
        ...creatorUser,
        createdCourses: [submittedCourse],
        createdTopics: [submittedTopic],
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/review/creators')
      .set('Authorization', authHeader(adminUser))
      .expect(200);

    expect(response.body.data.creators[0]).toMatchObject({
      id: creatorUser.id,
      courseCount: 1,
      topicCount: 1,
    });
  });
});
