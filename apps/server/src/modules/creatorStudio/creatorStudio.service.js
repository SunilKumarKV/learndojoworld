const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { createAppError } = require('../../utils/appError');
const {
  addContentBlocks,
  createTopic,
  getTopic,
} = require('../topics/topic.service');
const { TOPIC_STATUS } = require('../topics/topic.constants');
const {
  REVIEWABLE_CONTENT_TYPE,
} = require('../adminReview/adminReview.constants');
const { recordReviewEvent } = require('../adminReview/reviewEvent.service');
const { COURSE_STATUS } = require('./creatorStudio.constants');

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const noteOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const questionOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const lessonOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const moduleOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];

const quizInclude = {
  questions: {
    orderBy: questionOrderBy,
  },
};

const lessonInclude = {
  topicPage: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  },
  notes: {
    orderBy: noteOrderBy,
  },
  quiz: {
    include: quizInclude,
  },
};

const courseDetailInclude = {
  createdBy: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  modules: {
    orderBy: moduleOrderBy,
    include: {
      lessons: {
        orderBy: lessonOrderBy,
        include: lessonInclude,
      },
    },
  },
};

function slugify(value, fallback = 'course') {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function getCreatorCourseWhere(user) {
  if (user.role === ROLES.ADMIN) {
    return { status: { not: COURSE_STATUS.FLAGGED } };
  }

  return {
    createdById: user.id,
    status: { not: COURSE_STATUS.FLAGGED },
  };
}

function canManageCourse(user, course) {
  return user.role === ROLES.ADMIN || course.createdById === user.id;
}

function ensureCourseCanChange(course) {
  if (course.status === COURSE_STATUS.FLAGGED) {
    throw createAppError('Flagged courses cannot be changed', 400);
  }
}

async function createUniqueCourseSlug(title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.course.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function createUniqueModuleSlug(courseId, title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title, 'module');
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.courseModule.findUnique({
      where: {
        courseId_slug: {
          courseId,
          slug: candidate,
        },
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function createUniqueLessonSlug(moduleId, title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title, 'lesson');
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.lesson.findUnique({
      where: {
        moduleId_slug: {
          moduleId,
          slug: candidate,
        },
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function serializeQuestion(question) {
  return {
    id: question.id,
    quizId: question.quizId,
    prompt: question.prompt,
    type: question.type,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    order: question.order,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

function serializeQuiz(quiz) {
  if (!quiz) {
    return null;
  }

  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title,
    instructions: quiz.instructions,
    questions: (quiz.questions || []).map(serializeQuestion),
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

function serializeLessonNote(block) {
  return {
    id: block.id,
    lessonId: block.lessonId,
    type: block.type,
    title: block.title,
    content: block.content,
    language: block.language,
    referenceId: block.referenceId,
    order: block.order,
    metadata: block.metadata,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

function serializeLesson(lesson) {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    title: lesson.title,
    slug: lesson.slug,
    summary: lesson.summary,
    videoUrl: lesson.videoUrl,
    order: lesson.order,
    topicPage: lesson.topicPage || null,
    notes: (lesson.notes || []).map(serializeLessonNote),
    quiz: serializeQuiz(lesson.quiz),
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

function serializeModule(module) {
  return {
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    slug: module.slug,
    summary: module.summary,
    order: module.order,
    lessons: (module.lessons || []).map(serializeLesson),
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
}

function getCourseCounts(course) {
  const modules = course.modules || [];
  const lessons = modules.flatMap((module) => module.lessons || []);

  return {
    moduleCount: modules.length,
    lessonCount: lessons.length,
    videoLessonCount: lessons.filter((lesson) => lesson.videoUrl).length,
    quizCount: lessons.filter((lesson) => lesson.quiz).length,
    noteBlockCount: lessons.reduce(
      (total, lesson) => total + (lesson.notes?.length || 0),
      0
    ),
  };
}

function serializeCourseSummary(course) {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle,
    description: course.description,
    level: course.level,
    status: course.status,
    reviewNotes: course.reviewNotes,
    submittedAt: course.submittedAt,
    approvedAt: course.approvedAt,
    publishedAt: course.publishedAt,
    createdBy: course.createdBy,
    approvedBy: course.approvedBy,
    ...getCourseCounts(course),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function serializeCourseDetail(course) {
  return {
    ...serializeCourseSummary(course),
    modules: (course.modules || []).map(serializeModule),
  };
}

async function getManageableCourse(user, courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: courseDetailInclude,
  });

  if (!course || !canManageCourse(user, course)) {
    throw createAppError('Course not found', 404);
  }

  ensureCourseCanChange(course);
  return course;
}

async function getManageableModule(user, moduleId) {
  const courseModule = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    include: {
      lessons: {
        orderBy: lessonOrderBy,
        include: lessonInclude,
      },
      course: {
        include: {
          createdBy: { select: userSummarySelect },
          approvedBy: { select: userSummarySelect },
        },
      },
    },
  });

  if (!courseModule || !canManageCourse(user, courseModule.course)) {
    throw createAppError('Course module not found', 404);
  }

  ensureCourseCanChange(courseModule.course);
  return courseModule;
}

async function getManageableLesson(user, lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      ...lessonInclude,
      module: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson || !canManageCourse(user, lesson.module.course)) {
    throw createAppError('Lesson not found', 404);
  }

  ensureCourseCanChange(lesson.module.course);
  return lesson;
}

async function assertManageableTopicPage(user, topicPageId) {
  if (!topicPageId) {
    return;
  }

  const topic = await prisma.topicPage.findUnique({
    where: { id: topicPageId },
    select: {
      id: true,
      createdById: true,
      status: true,
    },
  });

  if (
    !topic ||
    topic.status === TOPIC_STATUS.FLAGGED ||
    (user.role !== ROLES.ADMIN && topic.createdById !== user.id)
  ) {
    throw createAppError('Topic page not found', 404);
  }
}

async function listCreatorCourses(user) {
  const courses = await prisma.course.findMany({
    where: getCreatorCourseWhere(user),
    include: courseDetailInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return courses.map(serializeCourseSummary);
}

async function getCreatorDashboard(user) {
  const courses = await listCreatorCourses(user);
  const stats = courses.reduce(
    (totals, course) => ({
      courses: totals.courses + 1,
      modules: totals.modules + course.moduleCount,
      lessons: totals.lessons + course.lessonCount,
      pendingReview:
        totals.pendingReview +
        (course.status === COURSE_STATUS.SUBMITTED ? 1 : 0),
      published:
        totals.published + (course.status === COURSE_STATUS.PUBLISHED ? 1 : 0),
    }),
    {
      courses: 0,
      modules: 0,
      lessons: 0,
      pendingReview: 0,
      published: 0,
    }
  );

  return {
    stats,
    recentCourses: courses.slice(0, 5),
  };
}

async function getCreatorCourse(user, courseId) {
  return serializeCourseDetail(await getManageableCourse(user, courseId));
}

async function getCreatorLesson(user, lessonId) {
  return serializeLesson(await getManageableLesson(user, lessonId));
}

async function createCreatorCourse(user, payload) {
  const slug = await createUniqueCourseSlug(payload.title, payload.slug);
  const course = await prisma.course.create({
    data: {
      title: payload.title,
      slug,
      subtitle: payload.subtitle,
      description: payload.description,
      level: payload.level,
      status: COURSE_STATUS.DRAFT,
      createdById: user.id,
    },
    include: courseDetailInclude,
  });

  return serializeCourseDetail(course);
}

async function createCourseModule(user, courseId, payload) {
  const course = await getManageableCourse(user, courseId);
  const slug = await createUniqueModuleSlug(
    courseId,
    payload.title,
    payload.slug
  );
  const latestModule = await prisma.courseModule.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const courseModule = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: payload.title,
      slug,
      summary: payload.summary,
      order: payload.order ?? (latestModule?.order ?? -1) + 1,
    },
    include: {
      lessons: {
        orderBy: lessonOrderBy,
        include: lessonInclude,
      },
    },
  });

  return serializeModule(courseModule);
}

async function createLesson(user, moduleId, payload) {
  const courseModule = await getManageableModule(user, moduleId);
  await assertManageableTopicPage(user, payload.topicPageId);

  const slug = await createUniqueLessonSlug(
    moduleId,
    payload.title,
    payload.slug
  );
  const latestLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const lesson = await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      title: payload.title,
      slug,
      summary: payload.summary,
      videoUrl: payload.videoUrl,
      topicPageId: payload.topicPageId,
      order: payload.order ?? (latestLesson?.order ?? -1) + 1,
    },
    include: lessonInclude,
  });

  return serializeLesson(lesson);
}

async function updateLesson(user, lessonId, payload) {
  await getManageableLesson(user, lessonId);

  if (Object.prototype.hasOwnProperty.call(payload, 'topicPageId')) {
    await assertManageableTopicPage(user, payload.topicPageId);
  }

  const data = {};

  ['title', 'summary', 'videoUrl', 'topicPageId'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = payload[field];
    }
  });

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data,
    include: lessonInclude,
  });

  return serializeLesson(lesson);
}

async function addLessonNotes(user, lessonId, blocks) {
  await getManageableLesson(user, lessonId);
  const latestBlock = await prisma.lessonContentBlock.findFirst({
    where: { lessonId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  let nextOrder = (latestBlock?.order ?? -1) + 1;

  const createdBlocks = await prisma.$transaction(
    blocks.map((block) => {
      const order = block.order ?? nextOrder;
      nextOrder += 1;

      return prisma.lessonContentBlock.create({
        data: {
          lessonId,
          type: block.type,
          title: block.title,
          content: block.content,
          language: block.language,
          referenceId: block.referenceId,
          order,
          metadata: block.metadata,
        },
      });
    })
  );

  return createdBlocks.map(serializeLessonNote);
}

function getQuestionData(quizId, question, index) {
  return {
    quizId,
    prompt: question.prompt,
    type: question.type,
    options: question.options || null,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    order: question.order ?? index,
  };
}

async function upsertLessonQuiz(user, lessonId, payload) {
  await getManageableLesson(user, lessonId);
  const existingQuiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: { id: true },
  });

  const quiz = await prisma.$transaction(async (tx) => {
    const savedQuiz = existingQuiz
      ? await tx.quiz.update({
          where: { id: existingQuiz.id },
          data: {
            title: payload.title,
            instructions: payload.instructions,
          },
        })
      : await tx.quiz.create({
          data: {
            lessonId,
            title: payload.title,
            instructions: payload.instructions,
          },
        });

    if (existingQuiz) {
      await tx.quizQuestion.deleteMany({
        where: { quizId: savedQuiz.id },
      });
    }

    const questions = await Promise.all(
      payload.questions.map((question, index) =>
        tx.quizQuestion.create({
          data: getQuestionData(savedQuiz.id, question, index),
        })
      )
    );

    return {
      ...savedQuiz,
      questions,
    };
  });

  return serializeQuiz(quiz);
}

function hasReviewableLesson(course) {
  return course.modules.some((courseModule) =>
    courseModule.lessons.some(
      (lesson) => lesson.videoUrl || lesson.notes.length || lesson.quiz
    )
  );
}

async function submitCourseForReview(user, courseId) {
  const course = await getManageableCourse(user, courseId);

  if (!course.modules.length) {
    throw createAppError('Add at least one module before submitting', 400);
  }

  if (!course.modules.some((courseModule) => courseModule.lessons.length)) {
    throw createAppError('Add at least one lesson before submitting', 400);
  }

  if (!hasReviewableLesson(course)) {
    throw createAppError(
      'Add a video, note block, or quiz before submitting',
      400
    );
  }

  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      status: COURSE_STATUS.SUBMITTED,
      submittedAt: new Date(),
      approvedById: null,
      approvedAt: null,
      publishedAt: null,
      reviewNotes: null,
    },
    include: courseDetailInclude,
  });

  await recordReviewEvent({
    actorId: user.id,
    contentType: REVIEWABLE_CONTENT_TYPE.COURSE,
    courseId,
    fromStatus: course.status,
    toStatus: COURSE_STATUS.SUBMITTED,
  });

  return serializeCourseDetail(updatedCourse);
}

async function createCreatorTopic(user, payload) {
  const topic = await createTopic(user, payload.topic);

  if (payload.blocks.length) {
    await addContentBlocks(user, topic.id, payload.blocks);
  }

  return getTopic(user, topic.id);
}

module.exports = {
  getCreatorDashboard,
  listCreatorCourses,
  getCreatorCourse,
  getCreatorLesson,
  createCreatorCourse,
  createCourseModule,
  createLesson,
  updateLesson,
  addLessonNotes,
  upsertLessonQuiz,
  submitCourseForReview,
  createCreatorTopic,
};
