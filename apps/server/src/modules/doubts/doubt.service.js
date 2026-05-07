const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { ROADMAP_STATUS } = require('../roadmaps/roadmap.constants');
const { TOPIC_STATUS } = require('../topics/topic.constants');
const { createAppError } = require('../../utils/appError');
const { DOUBT_REPORT_STATUS, DOUBT_STATUS } = require('./doubt.constants');

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const topicTargetSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  approvedAt: true,
  approvedById: true,
  createdById: true,
  roadmapNodeId: true,
};

const roadmapNodeTargetSelect = {
  id: true,
  title: true,
  slug: true,
  roadmapId: true,
  roadmap: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdById: true,
    },
  },
};

function isApprovedPublishedTopic(topic) {
  return (
    topic?.status === TOPIC_STATUS.PUBLISHED &&
    Boolean(topic.approvedAt) &&
    Boolean(topic.approvedById)
  );
}

function canUseTarget(user, target) {
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  if (target.topicPage && isApprovedPublishedTopic(target.topicPage)) {
    return true;
  }

  if (
    target.roadmapNode?.roadmap?.status === ROADMAP_STATUS.PUBLISHED ||
    target.topicPage?.roadmapNode?.roadmap?.status === ROADMAP_STATUS.PUBLISHED
  ) {
    return true;
  }

  if (user.role === ROLES.CREATOR) {
    return (
      target.topicPage?.createdById === user.id ||
      target.roadmapNode?.roadmap?.createdById === user.id ||
      target.topicPage?.roadmapNode?.roadmap?.createdById === user.id
    );
  }

  return false;
}

function canReadDoubt(user, doubt) {
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  if (doubt.status === DOUBT_STATUS.HIDDEN) {
    return false;
  }

  return canUseTarget(user, doubt);
}

function canMarkOfficial(user, doubt) {
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  if (user.role !== ROLES.CREATOR) {
    return false;
  }

  return (
    doubt.topicPage?.createdById === user.id ||
    doubt.roadmapNode?.roadmap?.createdById === user.id ||
    doubt.topicPage?.roadmapNode?.roadmap?.createdById === user.id
  );
}

function canAcceptReply(user, doubt) {
  return user.role === ROLES.ADMIN || doubt.authorId === user.id;
}

function buildReplyInclude(userId, includeHidden = false) {
  return {
    where: includeHidden ? undefined : { isHidden: false },
    include: {
      author: { select: userSummarySelect },
      officialMarkedBy: { select: userSummarySelect },
      votes: {
        where: { userId },
        select: { id: true },
      },
      _count: {
        select: {
          votes: true,
          reports: true,
        },
      },
    },
    orderBy: [{ isOfficial: 'desc' }, { createdAt: 'asc' }],
  };
}

function buildDoubtInclude(userId, includeHiddenReplies = false) {
  return {
    author: { select: userSummarySelect },
    topicPage: {
      select: {
        ...topicTargetSelect,
        roadmapNode: {
          select: roadmapNodeTargetSelect,
        },
      },
    },
    roadmapNode: { select: roadmapNodeTargetSelect },
    replies: buildReplyInclude(userId, includeHiddenReplies),
    votes: {
      where: { userId },
      select: { id: true },
    },
    _count: {
      select: {
        votes: true,
        reports: true,
        replies: true,
      },
    },
  };
}

function serializeReply(reply, acceptedReplyId) {
  return {
    id: reply.id,
    doubtId: reply.doubtId,
    content: reply.content,
    author: reply.author,
    isOfficial: reply.isOfficial,
    officialMarkedBy: reply.officialMarkedBy,
    officialMarkedAt: reply.officialMarkedAt,
    isAccepted: reply.id === acceptedReplyId,
    isHidden: reply.isHidden,
    moderationReason: reply.moderationReason,
    upvoteCount: reply._count?.votes || 0,
    hasUpvoted: Boolean(reply.votes?.length),
    reportCount: reply._count?.reports || 0,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
  };
}

function serializeDoubt(doubt) {
  return {
    id: doubt.id,
    title: doubt.title,
    content: doubt.content,
    status: doubt.status,
    topicPage: doubt.topicPage,
    roadmapNode: doubt.roadmapNode,
    videoTimestampSeconds: doubt.videoTimestampSeconds,
    author: doubt.author,
    acceptedReplyId: doubt.acceptedReplyId,
    moderationReason: doubt.moderationReason,
    upvoteCount: doubt._count?.votes || 0,
    hasUpvoted: Boolean(doubt.votes?.length),
    reportCount: doubt._count?.reports || 0,
    replyCount: doubt._count?.replies || doubt.replies?.length || 0,
    replies: (doubt.replies || []).map((reply) =>
      serializeReply(reply, doubt.acceptedReplyId)
    ),
    createdAt: doubt.createdAt,
    updatedAt: doubt.updatedAt,
  };
}

function serializeReport(report) {
  return {
    id: report.id,
    reason: report.reason,
    status: report.status,
    reporter: report.reporter,
    reviewedBy: report.reviewedBy,
    reviewedAt: report.reviewedAt,
    resolutionNotes: report.resolutionNotes,
    doubt: report.doubt ? serializeDoubt(report.doubt) : null,
    reply: report.reply
      ? serializeReply(report.reply, report.reply.doubt?.acceptedReplyId)
      : null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

async function getTopicTarget(topicPageId) {
  if (!topicPageId) {
    return null;
  }

  return prisma.topicPage.findUnique({
    where: { id: topicPageId },
    select: {
      ...topicTargetSelect,
      roadmapNode: {
        select: roadmapNodeTargetSelect,
      },
    },
  });
}

async function getRoadmapNodeTarget(roadmapNodeId) {
  if (!roadmapNodeId) {
    return null;
  }

  return prisma.roadmapNode.findUnique({
    where: { id: roadmapNodeId },
    select: roadmapNodeTargetSelect,
  });
}

async function assertTargetAvailable(user, payload) {
  const [topicPage, requestedNode] = await Promise.all([
    getTopicTarget(payload.topicPageId),
    getRoadmapNodeTarget(payload.roadmapNodeId),
  ]);

  if (payload.topicPageId && !topicPage) {
    throw createAppError('Topic page not found', 404);
  }

  if (payload.roadmapNodeId && !requestedNode) {
    throw createAppError('Roadmap node not found', 404);
  }

  const roadmapNode = requestedNode || topicPage?.roadmapNode || null;
  const target = { topicPage, roadmapNode };

  if (!target.topicPage && !target.roadmapNode) {
    throw createAppError(
      'Attach the doubt to a topic page or roadmap node',
      400
    );
  }

  if (!canUseTarget(user, target)) {
    throw createAppError('Doubt target is not available', 404);
  }

  if (
    topicPage?.roadmapNodeId &&
    requestedNode &&
    topicPage.roadmapNodeId !== requestedNode.id
  ) {
    throw createAppError('Topic page is not linked to this roadmap node', 400);
  }

  return {
    topicPageId: topicPage?.id || null,
    roadmapNodeId: roadmapNode?.id || null,
  };
}

function buildDoubtListWhere(user, filters) {
  const where = {
    topicPageId: filters.topicPageId,
    roadmapNodeId: filters.roadmapNodeId,
    status: filters.status,
  };

  if (user.role === ROLES.ADMIN) {
    return where;
  }

  return {
    ...where,
    status: filters.status || { not: DOUBT_STATUS.HIDDEN },
    OR: [
      {
        topicPage: {
          status: TOPIC_STATUS.PUBLISHED,
          approvedAt: { not: null },
          approvedById: { not: null },
        },
      },
      {
        roadmapNode: {
          roadmap: {
            status: ROADMAP_STATUS.PUBLISHED,
          },
        },
      },
    ],
  };
}

async function listDoubts(user, filters) {
  const doubts = await prisma.doubt.findMany({
    where: buildDoubtListWhere(user, filters),
    include: buildDoubtInclude(user.id, user.role === ROLES.ADMIN),
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return doubts
    .filter((doubt) => canReadDoubt(user, doubt))
    .map(serializeDoubt);
}

async function getReadableDoubt(user, doubtId, includeHiddenReplies = false) {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: buildDoubtInclude(user.id, includeHiddenReplies),
  });

  if (!doubt || !canReadDoubt(user, doubt)) {
    throw createAppError('Doubt not found', 404);
  }

  return doubt;
}

async function createDoubt(user, payload) {
  const target = await assertTargetAvailable(user, payload);
  const doubt = await prisma.doubt.create({
    data: {
      title: payload.title,
      content: payload.content,
      topicPageId: target.topicPageId,
      roadmapNodeId: target.roadmapNodeId,
      videoTimestampSeconds: payload.videoTimestampSeconds,
      authorId: user.id,
    },
    include: buildDoubtInclude(user.id),
  });

  return serializeDoubt(doubt);
}

async function createDoubtReply(user, doubtId, payload) {
  const doubt = await getReadableDoubt(user, doubtId);

  if ([DOUBT_STATUS.HIDDEN, DOUBT_STATUS.CLOSED].includes(doubt.status)) {
    throw createAppError('This doubt is closed for replies', 400);
  }

  const reply = await prisma.doubtReply.create({
    data: {
      doubtId: doubt.id,
      authorId: user.id,
      content: payload.content,
    },
    include: {
      author: { select: userSummarySelect },
      officialMarkedBy: { select: userSummarySelect },
      votes: {
        where: { userId: user.id },
        select: { id: true },
      },
      _count: {
        select: {
          votes: true,
          reports: true,
        },
      },
    },
  });

  return serializeReply(reply, doubt.acceptedReplyId);
}

async function getReplyForDoubt(doubtId, replyId) {
  const reply = await prisma.doubtReply.findFirst({
    where: {
      id: replyId,
      doubtId,
    },
  });

  if (!reply) {
    throw createAppError('Doubt reply not found', 404);
  }

  return reply;
}

async function markOfficialAnswer(user, doubtId, replyId) {
  const doubt = await getReadableDoubt(user, doubtId, true);
  await getReplyForDoubt(doubt.id, replyId);

  if (!canMarkOfficial(user, doubt)) {
    throw createAppError('Only the creator can mark the official answer', 403);
  }

  await prisma.doubtReply.updateMany({
    where: { doubtId: doubt.id },
    data: {
      isOfficial: false,
      officialMarkedById: null,
      officialMarkedAt: null,
    },
  });

  const reply = await prisma.doubtReply.update({
    where: { id: replyId },
    data: {
      isOfficial: true,
      officialMarkedById: user.id,
      officialMarkedAt: new Date(),
    },
    include: {
      author: { select: userSummarySelect },
      officialMarkedBy: { select: userSummarySelect },
      votes: {
        where: { userId: user.id },
        select: { id: true },
      },
      _count: {
        select: {
          votes: true,
          reports: true,
        },
      },
    },
  });

  return serializeReply(reply, doubt.acceptedReplyId);
}

async function acceptAnswer(user, doubtId, replyId) {
  const doubt = await getReadableDoubt(user, doubtId, true);
  await getReplyForDoubt(doubt.id, replyId);

  if (!canAcceptReply(user, doubt)) {
    throw createAppError('Only the doubt author can accept an answer', 403);
  }

  const updatedDoubt = await prisma.doubt.update({
    where: { id: doubt.id },
    data: {
      acceptedReplyId: replyId,
      status: DOUBT_STATUS.RESOLVED,
    },
    include: buildDoubtInclude(user.id, user.role === ROLES.ADMIN),
  });

  return serializeDoubt(updatedDoubt);
}

async function toggleDoubtVote(user, doubtId) {
  await getReadableDoubt(user, doubtId);
  const existingVote = await prisma.doubtVote.findFirst({
    where: {
      userId: user.id,
      doubtId,
    },
  });

  if (existingVote) {
    await prisma.doubtVote.delete({ where: { id: existingVote.id } });
  } else {
    await prisma.doubtVote.create({
      data: {
        userId: user.id,
        doubtId,
        value: 1,
      },
    });
  }

  const upvoteCount = await prisma.doubtVote.count({ where: { doubtId } });

  return {
    hasUpvoted: !existingVote,
    upvoteCount,
  };
}

async function toggleReplyVote(user, doubtId, replyId) {
  await getReadableDoubt(user, doubtId);
  await getReplyForDoubt(doubtId, replyId);
  const existingVote = await prisma.doubtVote.findFirst({
    where: {
      userId: user.id,
      replyId,
    },
  });

  if (existingVote) {
    await prisma.doubtVote.delete({ where: { id: existingVote.id } });
  } else {
    await prisma.doubtVote.create({
      data: {
        userId: user.id,
        replyId,
        value: 1,
      },
    });
  }

  const upvoteCount = await prisma.doubtVote.count({ where: { replyId } });

  return {
    hasUpvoted: !existingVote,
    upvoteCount,
  };
}

async function reportDoubt(user, doubtId, payload) {
  await getReadableDoubt(user, doubtId);
  const existingReport = await prisma.doubtReport.findFirst({
    where: {
      reporterId: user.id,
      doubtId,
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: { include: buildDoubtInclude(user.id, user.role === ROLES.ADMIN) },
      reply: true,
    },
  });

  if (existingReport) {
    return serializeReport(existingReport);
  }

  const report = await prisma.doubtReport.create({
    data: {
      reporterId: user.id,
      doubtId,
      reason: payload.reason,
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: { include: buildDoubtInclude(user.id, user.role === ROLES.ADMIN) },
      reply: true,
    },
  });

  return serializeReport(report);
}

async function reportReply(user, doubtId, replyId, payload) {
  await getReadableDoubt(user, doubtId);
  await getReplyForDoubt(doubtId, replyId);
  const existingReport = await prisma.doubtReport.findFirst({
    where: {
      reporterId: user.id,
      replyId,
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: true,
      reply: {
        include: {
          doubt: { select: { acceptedReplyId: true } },
          author: { select: userSummarySelect },
          officialMarkedBy: { select: userSummarySelect },
          votes: {
            where: { userId: user.id },
            select: { id: true },
          },
          _count: {
            select: {
              votes: true,
              reports: true,
            },
          },
        },
      },
    },
  });

  if (existingReport) {
    return serializeReport(existingReport);
  }

  const report = await prisma.doubtReport.create({
    data: {
      reporterId: user.id,
      replyId,
      reason: payload.reason,
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: true,
      reply: {
        include: {
          doubt: { select: { acceptedReplyId: true } },
          author: { select: userSummarySelect },
          officialMarkedBy: { select: userSummarySelect },
          votes: {
            where: { userId: user.id },
            select: { id: true },
          },
          _count: {
            select: {
              votes: true,
              reports: true,
            },
          },
        },
      },
    },
  });

  return serializeReport(report);
}

async function listModerationReports(filters = {}) {
  const reports = await prisma.doubtReport.findMany({
    where: {
      status: filters.status || DOUBT_REPORT_STATUS.PENDING,
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: {
        include: buildDoubtInclude('admin', true),
      },
      reply: {
        include: {
          doubt: { select: { acceptedReplyId: true } },
          author: { select: userSummarySelect },
          officialMarkedBy: { select: userSummarySelect },
          votes: { select: { id: true } },
          _count: {
            select: {
              votes: true,
              reports: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reports.map(serializeReport);
}

async function moderateDoubt(doubtId, payload) {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    select: { id: true },
  });

  if (!doubt) {
    throw createAppError('Doubt not found', 404);
  }

  const updatedDoubt = await prisma.doubt.update({
    where: { id: doubtId },
    data: {
      status: payload.status,
      moderationReason: payload.moderationReason,
      moderatedAt: new Date(),
    },
    include: buildDoubtInclude('admin', true),
  });

  return serializeDoubt(updatedDoubt);
}

async function moderateReply(replyId, payload) {
  const reply = await prisma.doubtReply.findUnique({
    where: { id: replyId },
    select: { id: true },
  });

  if (!reply) {
    throw createAppError('Doubt reply not found', 404);
  }

  const updatedReply = await prisma.doubtReply.update({
    where: { id: replyId },
    data: {
      isHidden: payload.isHidden,
      moderationReason: payload.moderationReason,
      moderatedAt: new Date(),
    },
    include: {
      doubt: { select: { acceptedReplyId: true } },
      author: { select: userSummarySelect },
      officialMarkedBy: { select: userSummarySelect },
      votes: { select: { id: true } },
      _count: {
        select: {
          votes: true,
          reports: true,
        },
      },
    },
  });

  return serializeReply(updatedReply, updatedReply.doubt.acceptedReplyId);
}

async function reviewReport(user, reportId, payload) {
  const report = await prisma.doubtReport.findUnique({
    where: { id: reportId },
    select: { id: true },
  });

  if (!report) {
    throw createAppError('Doubt report not found', 404);
  }

  const updatedReport = await prisma.doubtReport.update({
    where: { id: reportId },
    data: {
      status: payload.status,
      resolutionNotes: payload.resolutionNotes,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
    include: {
      reporter: { select: userSummarySelect },
      reviewedBy: { select: userSummarySelect },
      doubt: {
        include: buildDoubtInclude('admin', true),
      },
      reply: {
        include: {
          doubt: { select: { acceptedReplyId: true } },
          author: { select: userSummarySelect },
          officialMarkedBy: { select: userSummarySelect },
          votes: { select: { id: true } },
          _count: {
            select: {
              votes: true,
              reports: true,
            },
          },
        },
      },
    },
  });

  return serializeReport(updatedReport);
}

module.exports = {
  listDoubts,
  createDoubt,
  createDoubtReply,
  markOfficialAnswer,
  acceptAnswer,
  toggleDoubtVote,
  toggleReplyVote,
  reportDoubt,
  reportReply,
  listModerationReports,
  moderateDoubt,
  moderateReply,
  reviewReport,
};
