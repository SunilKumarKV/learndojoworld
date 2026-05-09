const prisma = require('../../lib/prisma');
const { createAppError } = require('../../utils/appError');

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  profile: true,
  learnerStats: true,
  _count: {
    select: {
      followers: true,
      following: true,
      createdCourses: true,
      createdTopics: true,
      createdRoadmaps: true,
      quizAttempts: true,
      studySessions: true,
      revisionItems: true,
      flashcards: true,
      doubts: true,
    },
  },
};

function sanitizeProfileInput(payload) {
  const allowed = ['headline', 'bio', 'location', 'website', 'avatarUrl'];
  const data = {};
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      data[key] = payload[key] ? String(payload[key]).trim() : null;
    }
  });

  if (Object.prototype.hasOwnProperty.call(payload, 'skills')) {
    data.skills = Array.isArray(payload.skills)
      ? payload.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 12)
      : String(payload.skills || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
          .slice(0, 12);
  }

  return data;
}

function roleSummary(user) {
  const counts = user._count || {};
  if (user.role === 'LEARNER') {
    return {
      label: 'Learner activity',
      metrics: [
        { label: 'Study sessions', value: counts.studySessions || 0 },
        { label: 'Quiz attempts', value: counts.quizAttempts || 0 },
        { label: 'Flashcards', value: counts.flashcards || 0 },
        { label: 'Revision items', value: counts.revisionItems || 0 },
      ],
    };
  }
  if (user.role === 'CREATOR') {
    return {
      label: 'Creator activity',
      metrics: [
        { label: 'Courses', value: counts.createdCourses || 0 },
        { label: 'Topics', value: counts.createdTopics || 0 },
        { label: 'Roadmaps', value: counts.createdRoadmaps || 0 },
        { label: 'Doubts answered', value: counts.doubts || 0 },
      ],
    };
  }
  return {
    label: 'Admin activity',
    metrics: [
      { label: 'Courses managed', value: counts.createdCourses || 0 },
      { label: 'Topics managed', value: counts.createdTopics || 0 },
      { label: 'Roadmaps managed', value: counts.createdRoadmaps || 0 },
      { label: 'Review actions', value: 0 },
    ],
  };
}

function toProfileDto(user, isFollowing = false) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    profile: user.profile || {
      headline: null,
      bio: null,
      location: null,
      website: null,
      avatarUrl: null,
      skills: [],
    },
    followerCount: user._count?.followers || 0,
    followingCount: user._count?.following || 0,
    isFollowing,
    learnerStats: user.learnerStats || null,
    roleSummary: roleSummary(user),
  };
}

async function ensureMyProfile(userId) {
  await prisma.userProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function getMyProfile(userId) {
  await ensureMyProfile(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  return toProfileDto(user, false);
}

async function updateMyProfile(userId, payload) {
  const data = sanitizeProfileInput(payload);
  await prisma.userProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return getMyProfile(userId);
}

async function listProfiles(currentUserId, query = '') {
  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { profile: { is: { headline: { contains: query, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    select: publicUserSelect,
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  const following = await prisma.userFollow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const followingSet = new Set(following.map((item) => item.followingId));
  return users.map((user) => toProfileDto(user, followingSet.has(user.id)));
}

async function followUser(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) throw createAppError('You cannot follow yourself', 400);
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) throw createAppError('User not found', 404);
  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    update: {},
    create: { followerId: currentUserId, followingId: targetUserId },
  });
  return getMyProfile(currentUserId);
}

async function unfollowUser(currentUserId, targetUserId) {
  await prisma.userFollow.deleteMany({ where: { followerId: currentUserId, followingId: targetUserId } });
  return getMyProfile(currentUserId);
}

async function listFollowers(userId) {
  const rows = await prisma.userFollow.findMany({
    where: { followingId: userId },
    include: { follower: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => toProfileDto(row.follower));
}

async function listFollowing(userId) {
  const rows = await prisma.userFollow.findMany({
    where: { followerId: userId },
    include: { following: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((row) => toProfileDto(row.following, true));
}

module.exports = { getMyProfile, updateMyProfile, listProfiles, followUser, unfollowUser, listFollowers, listFollowing };
