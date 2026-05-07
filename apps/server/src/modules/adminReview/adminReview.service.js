const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { createAppError } = require('../../utils/appError');
const {
  CONTENT_TYPE_PARAM,
  REVIEWABLE_CONTENT_TYPE,
  REVIEW_STATUS,
} = require('./adminReview.constants');
const { recordReviewEvent } = require('./reviewEvent.service');

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

const noteOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const lessonOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const moduleOrderBy = [{ order: 'asc' }, { createdAt: 'asc' }];
const reviewEventOrderBy = [{ createdAt: 'asc' }];

const reviewEventInclude = {
  actor: { select: userSummarySelect },
};

const coursePreviewInclude = {
  createdBy: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  modules: {
    orderBy: moduleOrderBy,
    include: {
      lessons: {
        orderBy: lessonOrderBy,
        include: {
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
            include: {
              questions: {
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
              },
            },
          },
        },
      },
    },
  },
  reviewEvents: {
    orderBy: reviewEventOrderBy,
    include: reviewEventInclude,
  },
};

const topicPreviewInclude = {
  createdBy: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  roadmapNode: {
    select: {
      id: true,
      title: true,
      slug: true,
      roadmapId: true,
    },
  },
  blocks: {
    orderBy: noteOrderBy,
  },
  reviewEvents: {
    orderBy: reviewEventOrderBy,
    include: reviewEventInclude,
  },
};

function toContentTypeParam(contentType) {
  return contentType === REVIEWABLE_CONTENT_TYPE.COURSE
    ? CONTENT_TYPE_PARAM.COURSE
    : CONTENT_TYPE_PARAM.TOPIC;
}

function toReviewableContentType(contentTypeParam) {
  return contentTypeParam === CONTENT_TYPE_PARAM.COURSE
    ? REVIEWABLE_CONTENT_TYPE.COURSE
    : REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE;
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

function serializeQueueItem(contentType, item) {
  return {
    id: item.id,
    contentType,
    contentTypeParam: toContentTypeParam(contentType),
    title: item.title,
    summary: item.subtitle || item.summary || item.description || null,
    status: item.status,
    reviewNotes: item.reviewNotes,
    submittedAt: item.submittedAt,
    approvedAt: item.approvedAt,
    publishedAt: item.publishedAt,
    creator: item.createdBy,
    updatedAt: item.updatedAt,
    ...(contentType === REVIEWABLE_CONTENT_TYPE.COURSE
      ? getCourseCounts(item)
      : { blockCount: item.blocks?.length || 0 }),
  };
}

function serializeLessonNote(block) {
  return {
    id: block.id,
    type: block.type,
    title: block.title,
    content: block.content,
    language: block.language,
    referenceId: block.referenceId,
    order: block.order,
    metadata: block.metadata,
  };
}

function serializeCourse(item) {
  return {
    ...serializeQueueItem(REVIEWABLE_CONTENT_TYPE.COURSE, item),
    subtitle: item.subtitle,
    description: item.description,
    level: item.level,
    approvedBy: item.approvedBy,
    modules: (item.modules || []).map((courseModule) => ({
      id: courseModule.id,
      title: courseModule.title,
      summary: courseModule.summary,
      order: courseModule.order,
      lessons: (courseModule.lessons || []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        videoUrl: lesson.videoUrl,
        order: lesson.order,
        topicPage: lesson.topicPage,
        notes: (lesson.notes || []).map(serializeLessonNote),
        quiz: lesson.quiz,
      })),
    })),
  };
}

function serializeTopic(item) {
  return {
    ...serializeQueueItem(REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE, item),
    approvedBy: item.approvedBy,
    roadmapNode: item.roadmapNode,
    blocks: (item.blocks || []).map(serializeLessonNote),
  };
}

function serializeTimelineEvent(event) {
  return {
    id: event.id,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    reason: event.reason,
    actor: event.actor,
    createdAt: event.createdAt,
  };
}

function buildTimeline(item) {
  const events = (item.reviewEvents || []).map(serializeTimelineEvent);
  const hasInitialEvent = events.some(
    (event) => event.toStatus === REVIEW_STATUS.DRAFT
  );

  return [
    ...(hasInitialEvent
      ? []
      : [
          {
            id: `${item.id}-created`,
            fromStatus: null,
            toStatus: REVIEW_STATUS.DRAFT,
            reason: null,
            actor: item.createdBy,
            createdAt: item.createdAt,
          },
        ]),
    ...events,
  ];
}

async function listReviewQueue(filters = {}) {
  const status = filters.status || REVIEW_STATUS.SUBMITTED;
  const shouldIncludeCourses =
    !filters.contentType || filters.contentType === CONTENT_TYPE_PARAM.COURSE;
  const shouldIncludeTopics =
    !filters.contentType || filters.contentType === CONTENT_TYPE_PARAM.TOPIC;

  const [courses, topics] = await Promise.all([
    shouldIncludeCourses
      ? prisma.course.findMany({
          where: { status },
          include: {
            createdBy: { select: userSummarySelect },
            modules: {
              include: {
                lessons: {
                  include: {
                    notes: true,
                    quiz: true,
                  },
                },
              },
            },
          },
          orderBy: [{ submittedAt: 'asc' }, { updatedAt: 'desc' }],
        })
      : [],
    shouldIncludeTopics
      ? prisma.topicPage.findMany({
          where: { status },
          include: {
            createdBy: { select: userSummarySelect },
            blocks: { select: { id: true } },
          },
          orderBy: [{ submittedAt: 'asc' }, { updatedAt: 'desc' }],
        })
      : [],
  ]);

  return [
    ...courses.map((course) =>
      serializeQueueItem(REVIEWABLE_CONTENT_TYPE.COURSE, course)
    ),
    ...topics.map((topic) =>
      serializeQueueItem(REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE, topic)
    ),
  ].sort((first, second) => {
    const firstDate = first.submittedAt || first.updatedAt;
    const secondDate = second.submittedAt || second.updatedAt;
    return new Date(firstDate).getTime() - new Date(secondDate).getTime();
  });
}

async function findContent(contentTypeParam, contentId) {
  if (contentTypeParam === CONTENT_TYPE_PARAM.COURSE) {
    return prisma.course.findUnique({
      where: { id: contentId },
      include: coursePreviewInclude,
    });
  }

  return prisma.topicPage.findUnique({
    where: { id: contentId },
    include: topicPreviewInclude,
  });
}

function serializePreview(contentTypeParam, item) {
  const contentType = toReviewableContentType(contentTypeParam);

  return {
    item:
      contentType === REVIEWABLE_CONTENT_TYPE.COURSE
        ? serializeCourse(item)
        : serializeTopic(item),
    timeline: buildTimeline(item),
  };
}

async function getContentPreview(contentTypeParam, contentId) {
  const item = await findContent(contentTypeParam, contentId);

  if (!item) {
    throw createAppError('Review content not found', 404);
  }

  return serializePreview(contentTypeParam, item);
}

function assertTransitionAllowed(item, nextStatus) {
  if (
    item.status === REVIEW_STATUS.FLAGGED &&
    nextStatus !== REVIEW_STATUS.FLAGGED
  ) {
    throw createAppError('Flagged content cannot be changed', 400);
  }

  if (nextStatus === REVIEW_STATUS.APPROVED) {
    if (
      ![REVIEW_STATUS.SUBMITTED, REVIEW_STATUS.REJECTED].includes(item.status)
    ) {
      throw createAppError(
        'Only submitted or rejected content can be approved',
        409
      );
    }
  }

  if (nextStatus === REVIEW_STATUS.REJECTED) {
    if (
      ![REVIEW_STATUS.SUBMITTED, REVIEW_STATUS.APPROVED].includes(item.status)
    ) {
      throw createAppError(
        'Only submitted or approved content can be rejected',
        409
      );
    }
  }

  if (nextStatus === REVIEW_STATUS.PUBLISHED) {
    if (item.status !== REVIEW_STATUS.APPROVED) {
      throw createAppError('Approve content before publishing', 409);
    }
  }
}

function getStatusUpdateData(item, nextStatus, admin, reason) {
  const now = new Date();
  const common = {
    status: nextStatus,
  };

  if (nextStatus === REVIEW_STATUS.APPROVED) {
    return {
      ...common,
      approvedById: admin.id,
      approvedAt: now,
      publishedAt: null,
      reviewNotes: null,
    };
  }

  if (nextStatus === REVIEW_STATUS.REJECTED) {
    return {
      ...common,
      approvedById: null,
      approvedAt: null,
      publishedAt: null,
      reviewNotes: reason,
    };
  }

  if (nextStatus === REVIEW_STATUS.PUBLISHED) {
    return {
      ...common,
      approvedById: item.approvedById || admin.id,
      approvedAt: item.approvedAt || now,
      publishedAt: now,
      reviewNotes: null,
    };
  }

  if (nextStatus === REVIEW_STATUS.FLAGGED) {
    return {
      ...common,
      publishedAt: null,
      reviewNotes: reason,
    };
  }

  return common;
}

async function updateContentStatus(
  admin,
  contentTypeParam,
  contentId,
  nextStatus,
  reason
) {
  const item = await findContent(contentTypeParam, contentId);

  if (!item) {
    throw createAppError('Review content not found', 404);
  }

  assertTransitionAllowed(item, nextStatus);

  const data = getStatusUpdateData(item, nextStatus, admin, reason);

  if (contentTypeParam === CONTENT_TYPE_PARAM.COURSE) {
    await prisma.course.update({
      where: { id: contentId },
      data,
    });
  } else {
    await prisma.topicPage.update({
      where: { id: contentId },
      data,
    });
  }

  await recordReviewEvent({
    actorId: admin.id,
    contentType: toReviewableContentType(contentTypeParam),
    courseId:
      contentTypeParam === CONTENT_TYPE_PARAM.COURSE ? contentId : undefined,
    topicPageId:
      contentTypeParam === CONTENT_TYPE_PARAM.TOPIC ? contentId : undefined,
    fromStatus: item.status,
    toStatus: nextStatus,
    reason,
  });

  return getContentPreview(contentTypeParam, contentId);
}

function getStatusCounts(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
}

function serializeCreator(creator, includeContent = false) {
  const courses = creator.createdCourses || [];
  const topics = creator.createdTopics || [];

  return {
    id: creator.id,
    name: creator.name,
    email: creator.email,
    role: creator.role,
    createdAt: creator.createdAt,
    courseCount: courses.length,
    topicCount: topics.length,
    statusCounts: {
      courses: getStatusCounts(courses),
      topics: getStatusCounts(topics),
    },
    ...(includeContent
      ? {
          courses: courses.map((course) =>
            serializeQueueItem(REVIEWABLE_CONTENT_TYPE.COURSE, course)
          ),
          topics: topics.map((topic) =>
            serializeQueueItem(REVIEWABLE_CONTENT_TYPE.TOPIC_PAGE, topic)
          ),
        }
      : {}),
  };
}

async function listCreators() {
  const creators = await prisma.user.findMany({
    where: { role: ROLES.CREATOR },
    select: {
      ...userSummarySelect,
      createdCourses: {
        include: {
          createdBy: { select: userSummarySelect },
          modules: {
            include: {
              lessons: {
                include: {
                  notes: true,
                  quiz: true,
                },
              },
            },
          },
        },
      },
      createdTopics: {
        include: {
          createdBy: { select: userSummarySelect },
          blocks: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return creators.map((creator) => serializeCreator(creator));
}

async function getCreatorDetails(creatorId) {
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: {
      ...userSummarySelect,
      createdCourses: {
        include: {
          createdBy: { select: userSummarySelect },
          modules: {
            include: {
              lessons: {
                include: {
                  notes: true,
                  quiz: true,
                },
              },
            },
          },
        },
      },
      createdTopics: {
        include: {
          createdBy: { select: userSummarySelect },
          blocks: { select: { id: true } },
        },
      },
    },
  });

  if (!creator || creator.role !== ROLES.CREATOR) {
    throw createAppError('Creator not found', 404);
  }

  return serializeCreator(creator, true);
}

module.exports = {
  listReviewQueue,
  getContentPreview,
  updateContentStatus,
  listCreators,
  getCreatorDetails,
};
