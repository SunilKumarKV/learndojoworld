const prisma = require('../../lib/prisma');

async function recordReviewEvent({
  actorId,
  contentType,
  courseId,
  topicPageId,
  fromStatus,
  toStatus,
  reason,
  metadata,
}) {
  return prisma.contentReviewEvent.create({
    data: {
      actorId,
      contentType,
      courseId,
      topicPageId,
      fromStatus,
      toStatus,
      reason,
      metadata,
    },
  });
}

module.exports = { recordReviewEvent };
