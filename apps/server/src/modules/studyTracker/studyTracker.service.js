const prisma = require('../../lib/prisma');
const { createAppError } = require('../../utils/appError');
const {
  NODE_PROGRESS_STATUS,
  ROADMAP_STATUS,
} = require('../roadmaps/roadmap.constants');
const { TOPIC_STATUS } = require('../topics/topic.constants');
const {
  REVISION_ITEM_STATUS,
  STUDY_PLAN_STATUS,
  STUDY_SESSION_STATUS,
} = require('./studyTracker.constants');
const { getFlashcardsDue } = require('../flashcards/flashcards.service');

const roadmapSummarySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
};

const topicSummarySelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  status: true,
};

const nodeSummarySelect = {
  id: true,
  roadmapId: true,
  title: true,
  slug: true,
  summary: true,
  order: true,
  roadmap: {
    select: roadmapSummarySelect,
  },
};

const planInclude = {
  roadmap: { select: roadmapSummarySelect },
  roadmapNode: { select: nodeSummarySelect },
};

const sessionInclude = {
  roadmap: { select: roadmapSummarySelect },
  roadmapNode: { select: nodeSummarySelect },
  topicPage: { select: topicSummarySelect },
};

const revisionInclude = {
  roadmapNode: { select: nodeSummarySelect },
  topicPage: { select: topicSummarySelect },
};

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date, amount) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

function getDateRange(date) {
  const baseDate = date ? new Date(`${date}T00:00:00`) : new Date();
  const start = startOfDay(baseDate);
  const end = addDays(start, 1);

  return { start, end };
}

function getWeekRange(referenceDate) {
  const end = addDays(startOfDay(referenceDate), 1);
  const start = addDays(end, -7);

  return { start, end };
}

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function isToday(date) {
  return formatDateKey(date) === formatDateKey(new Date());
}

function calculateProgressPercentage(totalNodes, completedNodes) {
  if (!totalNodes) {
    return 0;
  }

  return Math.round((completedNodes / totalNodes) * 100);
}

function getCompletedNodeCount(nodeProgress = []) {
  return nodeProgress.filter(
    (progress) => progress.status === NODE_PROGRESS_STATUS.COMPLETED
  ).length;
}

function serializePlan(plan) {
  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    plannedDate: plan.plannedDate,
    estimatedMinutes: plan.estimatedMinutes,
    status: plan.status,
    completedAt: plan.completedAt,
    roadmap: plan.roadmap,
    roadmapNode: plan.roadmapNode,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

function serializeSession(session) {
  return {
    id: session.id,
    title: session.title,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMinutes: session.durationMinutes,
    status: session.status,
    roadmap: session.roadmap,
    roadmapNode: session.roadmapNode,
    topicPage: session.topicPage,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function serializeRevisionItem(item) {
  return {
    id: item.id,
    title: item.title,
    reason: item.reason,
    dueAt: item.dueAt,
    confidence: item.confidence,
    intervalDays: item.intervalDays,
    status: item.status,
    completedAt: item.completedAt,
    roadmapNode: item.roadmapNode,
    topicPage: item.topicPage,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function serializeNode(node, progress) {
  return {
    id: node.id,
    roadmapId: node.roadmapId,
    title: node.title,
    slug: node.slug,
    summary: node.summary,
    order: node.order,
    status: progress?.status || NODE_PROGRESS_STATUS.NOT_STARTED,
    startedAt: progress?.startedAt || null,
    completedAt: progress?.completedAt || null,
    needsRevisionAt: progress?.needsRevisionAt || null,
  };
}

function findNextNode(nodes, nodeProgress) {
  const progressByNodeId = new Map(
    (nodeProgress || []).map((progress) => [progress.roadmapNodeId, progress])
  );
  const nodesWithProgress = nodes.map((node) => ({
    node,
    progress: progressByNodeId.get(node.id) || node.userProgress?.[0] || null,
  }));

  return (
    nodesWithProgress.find(
      ({ progress }) => progress?.status === NODE_PROGRESS_STATUS.IN_PROGRESS
    ) ||
    nodesWithProgress.find(
      ({ progress }) => progress?.status === NODE_PROGRESS_STATUS.NEEDS_REVISION
    ) ||
    nodesWithProgress.find(
      ({ progress }) =>
        !progress || progress.status === NODE_PROGRESS_STATUS.NOT_STARTED
    ) ||
    null
  );
}

function calculateCurrentStreak(sessions, referenceDate = new Date()) {
  const studiedDays = new Set(
    sessions.map((session) => formatDateKey(session.startedAt))
  );
  let cursor = startOfDay(referenceDate);

  if (!studiedDays.has(formatDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;

  while (studiedDays.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function calculateLongestStreak(sessions) {
  const dayKeys = [
    ...new Set(sessions.map((session) => formatDateKey(session.startedAt))),
  ].sort();
  let longest = 0;
  let current = 0;
  let previousDate = null;

  dayKeys.forEach((dayKey) => {
    const date = new Date(`${dayKey}T00:00:00`);

    if (!previousDate) {
      current = 1;
    } else {
      const daysBetween = Math.round((date - previousDate) / 86400000);
      current = daysBetween === 1 ? current + 1 : 1;
    }

    longest = Math.max(longest, current);
    previousDate = date;
  });

  return longest;
}

async function getContinueLearning(user) {
  const progressItems = await prisma.userRoadmapProgress.findMany({
    where: {
      userId: user.id,
      completedAt: null,
      roadmap: {
        status: ROADMAP_STATUS.PUBLISHED,
      },
    },
    include: {
      roadmap: {
        select: {
          ...roadmapSummarySelect,
          nodes: {
            select: {
              id: true,
              roadmapId: true,
              title: true,
              slug: true,
              summary: true,
              order: true,
              userProgress: {
                where: { userId: user.id },
                select: {
                  roadmapNodeId: true,
                  status: true,
                  startedAt: true,
                  completedAt: true,
                  needsRevisionAt: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
      nodeProgress: true,
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: 4,
  });

  return progressItems
    .map((progress) => {
      const next = findNextNode(progress.roadmap.nodes, progress.nodeProgress);
      const totalNodes = progress.roadmap.nodes.length;
      const completedNodes = getCompletedNodeCount(progress.nodeProgress);

      return {
        progressId: progress.id,
        roadmap: {
          id: progress.roadmap.id,
          title: progress.roadmap.title,
          slug: progress.roadmap.slug,
          description: progress.roadmap.description,
        },
        nextNode: next ? serializeNode(next.node, next.progress) : null,
        lastAccessedAt: progress.lastAccessedAt,
        completedNodes,
        totalNodes,
        progressPercentage: calculateProgressPercentage(
          totalNodes,
          completedNodes
        ),
      };
    })
    .filter((item) => item.nextNode);
}

async function listTodayPlans(userId, range) {
  const plans = await prisma.studyPlan.findMany({
    where: {
      userId,
      plannedDate: {
        gte: range.start,
        lt: range.end,
      },
    },
    include: planInclude,
    orderBy: [{ status: 'asc' }, { plannedDate: 'asc' }, { createdAt: 'asc' }],
  });

  return plans.map(serializePlan);
}

async function createDerivedDailyPlans(user, plannedDate) {
  const continueLearning = await getContinueLearning(user);
  const candidates = continueLearning.slice(0, 3);

  await Promise.all(
    candidates.map((item) =>
      prisma.studyPlan.create({
        data: {
          userId: user.id,
          roadmapId: item.roadmap.id,
          roadmapNodeId: item.nextNode.id,
          title: `Continue ${item.nextNode.title}`,
          description: `Work through ${item.roadmap.title}`,
          plannedDate,
          estimatedMinutes: 30,
        },
      })
    )
  );
}

async function getRevisionDue(user, range) {
  const revisionItems = await prisma.revisionItem.findMany({
    where: {
      userId: user.id,
      dueAt: { lt: range.end },
      status: {
        in: [REVISION_ITEM_STATUS.DUE, REVISION_ITEM_STATUS.SNOOZED],
      },
    },
    include: revisionInclude,
    orderBy: { dueAt: 'asc' },
    take: 8,
  });

  return revisionItems.map(serializeRevisionItem);
}

async function getWeakTopics(user) {
  const weakProgress = await prisma.userNodeProgress.findMany({
    where: {
      userId: user.id,
      status: NODE_PROGRESS_STATUS.NEEDS_REVISION,
    },
    include: {
      roadmapNode: {
        select: {
          ...nodeSummarySelect,
          topicPages: {
            where: {
              status: {
                in: [TOPIC_STATUS.APPROVED, TOPIC_STATUS.PUBLISHED],
              },
            },
            select: topicSummarySelect,
            take: 3,
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  });

  return weakProgress.map((progress) => ({
    id: progress.id,
    status: progress.status,
    needsRevisionAt: progress.needsRevisionAt,
    updatedAt: progress.updatedAt,
    roadmapNode: progress.roadmapNode,
    topics: progress.roadmapNode.topicPages,
  }));
}

async function getActiveSession(user) {
  const session = await prisma.studySession.findFirst({
    where: {
      userId: user.id,
      status: STUDY_SESSION_STATUS.ACTIVE,
    },
    include: sessionInclude,
    orderBy: { startedAt: 'desc' },
  });

  return session ? serializeSession(session) : null;
}

async function getWeeklyProgressSummary(user, referenceDate) {
  const range = getWeekRange(referenceDate);
  const [sessions, completedNodes] = await Promise.all([
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
        startedAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      select: {
        startedAt: true,
        durationMinutes: true,
      },
    }),
    prisma.userNodeProgress.findMany({
      where: {
        userId: user.id,
        status: NODE_PROGRESS_STATUS.COMPLETED,
        completedAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      select: {
        completedAt: true,
      },
    }),
  ]);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(range.start, index);
    const dateKey = formatDateKey(date);
    const studyMinutes = sessions
      .filter((session) => formatDateKey(session.startedAt) === dateKey)
      .reduce((total, session) => total + (session.durationMinutes || 0), 0);
    const completedNodeCount = completedNodes.filter(
      (progress) => formatDateKey(progress.completedAt) === dateKey
    ).length;

    return {
      date: dateKey,
      studyMinutes,
      completedNodes: completedNodeCount,
    };
  });
}

async function getStudyTimeSummary(user, todayRange, weekRange) {
  const [today, week, total] = await Promise.all([
    prisma.studySession.aggregate({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
        startedAt: {
          gte: todayRange.start,
          lt: todayRange.end,
        },
      },
      _sum: { durationMinutes: true },
    }),
    prisma.studySession.aggregate({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
        startedAt: {
          gte: weekRange.start,
          lt: weekRange.end,
        },
      },
      _sum: { durationMinutes: true },
    }),
    prisma.studySession.aggregate({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
      },
      _sum: { durationMinutes: true },
    }),
  ]);

  return {
    todayMinutes: today._sum.durationMinutes || 0,
    weekMinutes: week._sum.durationMinutes || 0,
    totalMinutes: total._sum.durationMinutes || 0,
  };
}

async function syncLearnerStats(user, referenceDate = new Date()) {
  const [recentSessions, total] = await Promise.all([
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
      },
      select: {
        startedAt: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 400,
    }),
    prisma.studySession.aggregate({
      where: {
        userId: user.id,
        status: STUDY_SESSION_STATUS.COMPLETED,
      },
      _sum: { durationMinutes: true },
    }),
  ]);

  const currentStreak = calculateCurrentStreak(recentSessions, referenceDate);
  const longestStreak = Math.max(
    currentStreak,
    calculateLongestStreak(recentSessions)
  );
  const data = {
    currentStreak,
    longestStreak,
    totalStudyMinutes: total._sum.durationMinutes || 0,
    lastStudiedAt: recentSessions[0]?.startedAt || null,
  };

  const existingStats = await prisma.learnerStats.findUnique({
    where: { userId: user.id },
  });

  if (!existingStats) {
    return prisma.learnerStats.create({
      data: {
        userId: user.id,
        ...data,
      },
    });
  }

  return prisma.learnerStats.update({
    where: { userId: user.id },
    data: {
      ...data,
      longestStreak: Math.max(existingStats.longestStreak, data.longestStreak),
    },
  });
}


async function safeDashboardSection(label, fallbackValue, loader) {
  try {
    return await loader();
  } catch (error) {
    console.error(`[StudyTracker dashboard] ${label} failed`, {
      message: error?.message,
      code: error?.code,
    });
    return fallbackValue;
  }
}

function calculateXpLevel(totalStudyMinutes = 0, completedNodeCount = 0) {
  const xp = totalStudyMinutes * 2 + completedNodeCount * 75;
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const currentLevelXp = (level - 1) * 500;
  const nextLevelXp = level * 500;
  const progressToNextLevel = Math.round(
    ((xp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)) * 100
  );

  return { xp, level, progressToNextLevel, nextLevelXp };
}

async function getCompletedNodeTotal(userId) {
  return prisma.userNodeProgress.count({
    where: {
      userId,
      status: NODE_PROGRESS_STATUS.COMPLETED,
    },
  });
}

async function getStudyDashboard(user, query = {}) {
  const todayRange = getDateRange(query.date);
  const weekRange = getWeekRange(todayRange.start);

  let todaysPlan = await safeDashboardSection('today plan', [], () =>
    listTodayPlans(user.id, todayRange)
  );

  if (!todaysPlan.length && isToday(todayRange.start)) {
    await safeDashboardSection('derived daily plans', null, () =>
      createDerivedDailyPlans(user, todayRange.start)
    );
    todaysPlan = await safeDashboardSection('today plan reload', [], () =>
      listTodayPlans(user.id, todayRange)
    );
  }

  const [
    continueLearning,
    revisionDue,
    flashcardsDue,
    weakTopics,
    weeklyProgress,
    activeSession,
    studyTime,
    stats,
    completedNodeTotal,
  ] = await Promise.all([
    safeDashboardSection('continue learning', [], () => getContinueLearning(user)),
    safeDashboardSection('revision due', [], () => getRevisionDue(user, todayRange)),
    safeDashboardSection('flashcards due', [], () => getFlashcardsDue(user, todayRange)),
    safeDashboardSection('weak topics', [], () => getWeakTopics(user)),
    safeDashboardSection('weekly progress', [], () =>
      getWeeklyProgressSummary(user, todayRange.start)
    ),
    safeDashboardSection('active session', null, () => getActiveSession(user)),
    safeDashboardSection('study time', {
      todayMinutes: 0,
      weekMinutes: 0,
      totalMinutes: 0,
    }, () => getStudyTimeSummary(user, todayRange, weekRange)),
    safeDashboardSection('learner stats', {
      currentStreak: 0,
      longestStreak: 0,
      lastStudiedAt: null,
    }, () => syncLearnerStats(user, todayRange.start)),
    safeDashboardSection('completed node total', 0, () => getCompletedNodeTotal(user.id)),
  ]);

  const xpLevel = calculateXpLevel(
    studyTime.totalMinutes || 0,
    completedNodeTotal || 0
  );

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    today: {
      date: formatDateKey(todayRange.start),
      plan: todaysPlan,
    },
    continueLearning,
    revisionDue,
    flashcardsDue,
    weakTopics,
    weeklyProgress,
    activeSession,
    streak: {
      current: stats.currentStreak || 0,
      longest: stats.longestStreak || 0,
      lastStudiedAt: stats.lastStudiedAt || null,
    },
    studyTime,
    xpLevel,
    hasRealLearningData: Boolean(
      todaysPlan.length ||
        continueLearning.length ||
        revisionDue.length ||
        flashcardsDue.length ||
        weakTopics.length ||
        weeklyProgress.some((item) => item.studyMinutes || item.completedNodes)
    ),
  };
}

async function assertRoadmapReference(payload) {
  if (!payload.roadmapId && !payload.roadmapNodeId) {
    return {
      roadmapId: payload.roadmapId,
      roadmapNodeId: payload.roadmapNodeId,
    };
  }

  if (payload.roadmapNodeId) {
    const node = await prisma.roadmapNode.findUnique({
      where: { id: payload.roadmapNodeId },
      include: { roadmap: true },
    });

    if (!node || node.roadmap.status !== ROADMAP_STATUS.PUBLISHED) {
      throw createAppError('Roadmap node not found', 404);
    }

    if (payload.roadmapId && payload.roadmapId !== node.roadmapId) {
      throw createAppError('Roadmap node does not belong to this roadmap', 400);
    }

    return {
      roadmapId: node.roadmapId,
      roadmapNodeId: node.id,
    };
  }

  const roadmap = await prisma.roadmap.findUnique({
    where: { id: payload.roadmapId },
  });

  if (!roadmap || roadmap.status !== ROADMAP_STATUS.PUBLISHED) {
    throw createAppError('Roadmap not found', 404);
  }

  return {
    roadmapId: roadmap.id,
    roadmapNodeId: null,
  };
}

async function assertTopicReference(topicPageId) {
  if (!topicPageId) {
    return null;
  }

  const topic = await prisma.topicPage.findUnique({
    where: { id: topicPageId },
  });

  if (
    !topic ||
    ![TOPIC_STATUS.APPROVED, TOPIC_STATUS.PUBLISHED].includes(topic.status)
  ) {
    throw createAppError('Topic page not found', 404);
  }

  return topic.id;
}

async function createStudyPlan(user, payload) {
  const roadmapReference = await assertRoadmapReference(payload);
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      roadmapId: roadmapReference.roadmapId,
      roadmapNodeId: roadmapReference.roadmapNodeId,
      title: payload.title,
      description: payload.description,
      plannedDate: payload.plannedDate,
      estimatedMinutes: payload.estimatedMinutes,
    },
    include: planInclude,
  });

  return serializePlan(plan);
}

async function updateStudyPlan(user, planId, payload) {
  const plan = await prisma.studyPlan.findFirst({
    where: {
      id: planId,
      userId: user.id,
    },
  });

  if (!plan) {
    throw createAppError('Study plan not found', 404);
  }

  const updatedPlan = await prisma.studyPlan.update({
    where: { id: plan.id },
    data: {
      status: payload.status,
      completedAt:
        payload.status === STUDY_PLAN_STATUS.COMPLETED ? new Date() : null,
    },
    include: planInclude,
  });

  return serializePlan(updatedPlan);
}

async function startStudySession(user, payload = {}) {
  const activeSession = await prisma.studySession.findFirst({
    where: {
      userId: user.id,
      status: STUDY_SESSION_STATUS.ACTIVE,
    },
  });

  if (activeSession) {
    throw createAppError(
      'Finish the active study session before starting a new one',
      409
    );
  }

  const roadmapReference = await assertRoadmapReference(payload);
  const topicPageId = await assertTopicReference(payload.topicPageId);
  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      roadmapId: roadmapReference.roadmapId,
      roadmapNodeId: roadmapReference.roadmapNodeId,
      topicPageId,
      title: payload.title,
    },
    include: sessionInclude,
  });

  if (roadmapReference.roadmapId) {
    await prisma.userRoadmapProgress.updateMany({
      where: {
        userId: user.id,
        roadmapId: roadmapReference.roadmapId,
      },
      data: {
        lastAccessedAt: session.startedAt,
      },
    });
  }

  return serializeSession(session);
}

async function completeStudySession(user, sessionId, payload = {}) {
  const session = await prisma.studySession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
  });

  if (!session) {
    throw createAppError('Study session not found', 404);
  }

  if (session.status !== STUDY_SESSION_STATUS.ACTIVE) {
    throw createAppError('Study session is already completed', 409);
  }

  const endedAt = new Date();
  const durationMinutes =
    payload.durationMinutes ||
    Math.max(
      1,
      Math.ceil((endedAt.getTime() - session.startedAt.getTime()) / 60000)
    );

  const updatedSession = await prisma.studySession.update({
    where: { id: session.id },
    data: {
      endedAt,
      durationMinutes,
      status: STUDY_SESSION_STATUS.COMPLETED,
    },
    include: sessionInclude,
  });
  const stats = await syncLearnerStats(user, endedAt);

  return {
    session: serializeSession(updatedSession),
    stats,
  };
}

async function createRevisionItem(user, payload) {
  const roadmapReference = await assertRoadmapReference(payload);
  const topicPageId = await assertTopicReference(payload.topicPageId);
  const item = await prisma.revisionItem.create({
    data: {
      userId: user.id,
      roadmapNodeId: roadmapReference.roadmapNodeId,
      topicPageId,
      title: payload.title,
      reason: payload.reason,
      dueAt: payload.dueAt,
      confidence: payload.confidence,
      intervalDays: payload.intervalDays,
    },
    include: revisionInclude,
  });

  return serializeRevisionItem(item);
}

async function updateRevisionItem(user, revisionId, payload = {}) {
  const item = await prisma.revisionItem.findFirst({
    where: {
      id: revisionId,
      userId: user.id,
    },
  });

  if (!item) {
    throw createAppError('Revision item not found', 404);
  }

  const status = payload.status || REVISION_ITEM_STATUS.COMPLETED;
  const updatedItem = await prisma.revisionItem.update({
    where: { id: item.id },
    data: {
      status,
      confidence: payload.confidence,
      completedAt:
        status === REVISION_ITEM_STATUS.COMPLETED ? new Date() : null,
    },
    include: revisionInclude,
  });

  return serializeRevisionItem(updatedItem);
}

module.exports = {
  getStudyDashboard,
  createStudyPlan,
  updateStudyPlan,
  startStudySession,
  completeStudySession,
  createRevisionItem,
  updateRevisionItem,
};
