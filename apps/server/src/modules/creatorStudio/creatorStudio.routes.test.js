const request = require('supertest');

jest.mock('../../lib/prisma', () => ({
  $transaction: jest.fn(),
  user: {
    findUnique: jest.fn(),
  },
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  courseModule: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  lessonContentBlock: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  quiz: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  quizQuestion: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  roadmapNode: {
    findUnique: jest.fn(),
  },
  topicPage: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  contentBlock: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  contentReviewEvent: {
    create: jest.fn(),
  },
}));

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-creator-studio';
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

const baseCourse = {
  id: 'course_1',
  title: 'Frontend Foundations',
  slug: 'frontend-foundations',
  subtitle: 'HTML to React',
  description: 'Build modern frontend skills',
  level: 'Beginner',
  status: 'DRAFT',
  reviewNotes: null,
  submittedAt: null,
  approvedAt: null,
  publishedAt: null,
  createdById: creatorUser.id,
  createdBy: creatorUser,
  approvedById: null,
  approvedBy: null,
  modules: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const baseModule = {
  id: 'module_1',
  courseId: baseCourse.id,
  title: 'HTML basics',
  slug: 'html-basics',
  summary: 'Structure web pages',
  order: 0,
  lessons: [],
  course: baseCourse,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const noteBlock = {
  id: 'note_1',
  lessonId: 'lesson_1',
  type: 'PARAGRAPH',
  title: null,
  content: 'HTML gives the browser page structure.',
  language: null,
  referenceId: null,
  order: 0,
  metadata: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const baseLesson = {
  id: 'lesson_1',
  moduleId: baseModule.id,
  title: 'Create your first page',
  slug: 'create-your-first-page',
  summary: 'Use semantic tags',
  videoUrl: null,
  order: 0,
  topicPage: null,
  notes: [],
  quiz: null,
  module: {
    ...baseModule,
    course: baseCourse,
  },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function authHeader(user) {
  return `Bearer ${signAccessToken(user)}`;
}

function mockAuthenticatedUser(user) {
  prisma.user.findUnique.mockResolvedValue(user);
}

describe('Creator Studio routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) {
        return Promise.all(operation);
      }

      return operation(prisma);
    });
  });

  it('allows creators to create courses', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.course.findUnique.mockResolvedValue(null);
    prisma.course.create.mockResolvedValue(baseCourse);

    const response = await request(app)
      .post('/api/v1/creator-studio/courses')
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'Frontend Foundations',
        subtitle: 'HTML to React',
        level: 'Beginner',
      })
      .expect(201);

    expect(response.body.data.course).toMatchObject({
      title: 'Frontend Foundations',
      slug: 'frontend-foundations',
      status: 'DRAFT',
      moduleCount: 0,
    });
    expect(prisma.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: creatorUser.id,
          status: 'DRAFT',
        }),
      })
    );
  });

  it('blocks learners from Creator Studio', async () => {
    mockAuthenticatedUser(learnerUser);

    const response = await request(app)
      .post('/api/v1/creator-studio/courses')
      .set('Authorization', authHeader(learnerUser))
      .send({ title: 'Frontend Foundations' })
      .expect(403);

    expect(response.body.message).toBe(
      'You do not have permission to access this resource'
    );
    expect(prisma.course.create).not.toHaveBeenCalled();
  });

  it('adds course modules and lessons', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.course.findUnique.mockResolvedValue(baseCourse);
    prisma.courseModule.findUnique.mockResolvedValue(null);
    prisma.courseModule.findFirst.mockResolvedValue(null);
    prisma.courseModule.create.mockResolvedValue(baseModule);
    prisma.lesson.findUnique.mockResolvedValue(null);
    prisma.lesson.findFirst.mockResolvedValue(null);
    prisma.lesson.create.mockResolvedValue({
      ...baseLesson,
      videoUrl: 'https://video.example.com/html',
    });

    const moduleResponse = await request(app)
      .post(`/api/v1/creator-studio/courses/${baseCourse.id}/modules`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'HTML basics',
        summary: 'Structure web pages',
      })
      .expect(201);

    prisma.courseModule.findUnique.mockResolvedValue({
      ...baseModule,
      course: baseCourse,
    });

    const lessonResponse = await request(app)
      .post(`/api/v1/creator-studio/modules/${baseModule.id}/lessons`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'Create your first page',
        videoUrl: 'https://video.example.com/html',
      })
      .expect(201);

    expect(moduleResponse.body.data.module.title).toBe('HTML basics');
    expect(lessonResponse.body.data.lesson).toMatchObject({
      title: 'Create your first page',
      videoUrl: 'https://video.example.com/html',
    });
  });

  it('updates lesson video URLs and adds note blocks', async () => {
    mockAuthenticatedUser(creatorUser);
    prisma.lesson.findUnique.mockResolvedValue(baseLesson);
    prisma.lesson.update.mockResolvedValue({
      ...baseLesson,
      videoUrl: 'https://video.example.com/html',
    });
    prisma.lessonContentBlock.findFirst.mockResolvedValue(null);
    prisma.lessonContentBlock.create.mockResolvedValue(noteBlock);

    const updateResponse = await request(app)
      .patch(`/api/v1/creator-studio/lessons/${baseLesson.id}`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        videoUrl: 'https://video.example.com/html',
      })
      .expect(200);

    const notesResponse = await request(app)
      .post(`/api/v1/creator-studio/lessons/${baseLesson.id}/notes`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        blocks: [
          {
            type: 'PARAGRAPH',
            content: 'HTML gives the browser page structure.',
          },
        ],
      })
      .expect(201);

    expect(updateResponse.body.data.lesson.videoUrl).toBe(
      'https://video.example.com/html'
    );
    expect(notesResponse.body.data.blocks).toHaveLength(1);
  });

  it('saves lesson quizzes and submits reviewable courses', async () => {
    mockAuthenticatedUser(creatorUser);
    const reviewableLesson = {
      ...baseLesson,
      videoUrl: 'https://video.example.com/html',
      notes: [noteBlock],
    };
    const reviewableCourse = {
      ...baseCourse,
      modules: [
        {
          ...baseModule,
          lessons: [reviewableLesson],
        },
      ],
    };
    prisma.lesson.findUnique.mockResolvedValue(reviewableLesson);
    prisma.quiz.findUnique.mockResolvedValue(null);
    prisma.quiz.create.mockResolvedValue({
      id: 'quiz_1',
      lessonId: baseLesson.id,
      title: 'HTML checkpoint',
      instructions: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.quizQuestion.create.mockResolvedValue({
      id: 'question_1',
      quizId: 'quiz_1',
      prompt: 'Which tag creates a heading?',
      type: 'MULTIPLE_CHOICE',
      options: ['h1', 'p'],
      correctAnswer: 'h1',
      explanation: null,
      order: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.course.findUnique.mockResolvedValue(reviewableCourse);
    prisma.course.update.mockResolvedValue({
      ...reviewableCourse,
      status: 'SUBMITTED',
      submittedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const quizResponse = await request(app)
      .post(`/api/v1/creator-studio/lessons/${baseLesson.id}/quiz`)
      .set('Authorization', authHeader(creatorUser))
      .send({
        title: 'HTML checkpoint',
        questions: [
          {
            prompt: 'Which tag creates a heading?',
            options: ['h1', 'p'],
            correctAnswer: 'h1',
          },
        ],
      })
      .expect(200);

    const reviewResponse = await request(app)
      .post(`/api/v1/creator-studio/courses/${baseCourse.id}/submit-review`)
      .set('Authorization', authHeader(creatorUser))
      .send({})
      .expect(200);

    expect(quizResponse.body.data.quiz.questions).toHaveLength(1);
    expect(reviewResponse.body.data.course.status).toBe('SUBMITTED');
  });

  it('creates topic pages with initial blocks from Creator Studio', async () => {
    mockAuthenticatedUser(creatorUser);
    const topic = {
      id: 'topic_1',
      title: 'HTML Introduction',
      slug: 'html-introduction',
      summary: 'Learn HTML',
      status: 'DRAFT',
      roadmapNodeId: null,
      createdById: creatorUser.id,
      approvedById: null,
      approvedAt: null,
      publishedAt: null,
      createdBy: creatorUser,
      approvedBy: null,
      roadmapNode: null,
      blocks: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    prisma.topicPage.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(topic)
      .mockResolvedValueOnce({
        ...topic,
        blocks: [noteBlock],
      });
    prisma.topicPage.create.mockResolvedValue(topic);
    prisma.contentBlock.findFirst.mockResolvedValue(null);
    prisma.contentBlock.create.mockResolvedValue({
      ...noteBlock,
      topicPageId: topic.id,
    });

    const response = await request(app)
      .post('/api/v1/creator-studio/topics')
      .set('Authorization', authHeader(creatorUser))
      .send({
        topic: {
          title: 'HTML Introduction',
          summary: 'Learn HTML',
        },
        blocks: [
          {
            type: 'PARAGRAPH',
            content: 'HTML structures a page.',
          },
        ],
      })
      .expect(201);

    expect(response.body.data.topic.blocks).toHaveLength(1);
    expect(prisma.topicPage.create).toHaveBeenCalled();
    expect(prisma.contentBlock.create).toHaveBeenCalled();
  });
});
