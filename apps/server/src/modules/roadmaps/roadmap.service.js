const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { createAppError } = require('../../utils/appError');
const { NODE_PROGRESS_STATUS, ROADMAP_STATUS } = require('./roadmap.constants');

const roadmapCreatorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

const nodeSummarySelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  order: true,
};

const nodeInclude = {
  prerequisites: {
    select: nodeSummarySelect,
    orderBy: { order: 'asc' },
  },
  unlocks: {
    select: nodeSummarySelect,
    orderBy: { order: 'asc' },
  },
};

const progressInclude = {
  roadmap: {
    include: {
      nodes: {
        select: { id: true },
      },
    },
  },
  nodeProgress: true,
};

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'roadmap';
}

function unique(values) {
  return [...new Set(values)];
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

function serializeNodeProgress(progress) {
  if (!progress) {
    return null;
  }

  return {
    id: progress.id,
    roadmapNodeId: progress.roadmapNodeId,
    status: progress.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    needsRevisionAt: progress.needsRevisionAt,
    updatedAt: progress.updatedAt,
  };
}

function serializeProgress(progress) {
  if (!progress) {
    return {
      startedAt: null,
      completedAt: null,
      lastAccessedAt: null,
      totalNodes: 0,
      completedNodes: 0,
      progressPercentage: 0,
    };
  }

  const totalNodes = progress.roadmap?.nodes?.length || 0;
  const completedNodes = getCompletedNodeCount(progress.nodeProgress);

  return {
    id: progress.id,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    lastAccessedAt: progress.lastAccessedAt,
    totalNodes,
    completedNodes,
    progressPercentage: calculateProgressPercentage(totalNodes, completedNodes),
  };
}

function serializeRoadmapSummary(roadmap) {
  const progress = roadmap.learnerProgress?.[0];
  const totalNodes = roadmap.nodes?.length || 0;
  const completedNodes = getCompletedNodeCount(progress?.nodeProgress);

  return {
    id: roadmap.id,
    title: roadmap.title,
    slug: roadmap.slug,
    description: roadmap.description,
    status: roadmap.status,
    createdBy: roadmap.createdBy,
    totalNodes,
    completedNodes,
    progressPercentage: calculateProgressPercentage(totalNodes, completedNodes),
    startedAt: progress?.startedAt || null,
    completedAt: progress?.completedAt || null,
    createdAt: roadmap.createdAt,
    updatedAt: roadmap.updatedAt,
  };
}

function serializeRoadmapNode(node, progressByNodeId = new Map()) {
  const progress = progressByNodeId.get(node.id);

  return {
    id: node.id,
    roadmapId: node.roadmapId,
    title: node.title,
    slug: node.slug,
    summary: node.summary,
    content: node.content,
    order: node.order,
    prerequisites: node.prerequisites || [],
    unlocks: node.unlocks || [],
    progress: serializeNodeProgress(progress) || {
      roadmapNodeId: node.id,
      status: NODE_PROGRESS_STATUS.NOT_STARTED,
      startedAt: null,
      completedAt: null,
      needsRevisionAt: null,
    },
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

function canReadRoadmap(user, roadmap) {
  if (roadmap.status === ROADMAP_STATUS.PUBLISHED) {
    return true;
  }

  return [ROLES.ADMIN, ROLES.CREATOR].includes(user.role);
}

async function createUniqueRoadmapSlug(title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.roadmap.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function createUniqueNodeSlug(roadmapId, title, requestedSlug) {
  const baseSlug = slugify(requestedSlug || title);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.roadmapNode.findUnique({
      where: {
        roadmapId_slug: {
          roadmapId,
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

async function listRoadmaps(user) {
  const roadmaps = await prisma.roadmap.findMany({
    where:
      user.role === ROLES.LEARNER
        ? { status: ROADMAP_STATUS.PUBLISHED }
        : { status: { not: ROADMAP_STATUS.ARCHIVED } },
    include: {
      createdBy: { select: roadmapCreatorSelect },
      nodes: {
        select: { id: true },
      },
      learnerProgress: {
        where: { userId: user.id },
        include: {
          nodeProgress: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return roadmaps.map(serializeRoadmapSummary);
}

async function getRoadmap(user, roadmapId) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: {
      createdBy: { select: roadmapCreatorSelect },
      nodes: {
        include: nodeInclude,
        orderBy: { order: 'asc' },
      },
      learnerProgress: {
        where: { userId: user.id },
        include: {
          nodeProgress: true,
          roadmap: {
            include: {
              nodes: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!roadmap || !canReadRoadmap(user, roadmap)) {
    throw createAppError('Roadmap not found', 404);
  }

  const progress = roadmap.learnerProgress?.[0] || null;
  const progressByNodeId = new Map(
    (progress?.nodeProgress || []).map((nodeProgress) => [
      nodeProgress.roadmapNodeId,
      nodeProgress,
    ])
  );

  return {
    ...serializeRoadmapSummary(roadmap),
    progress: serializeProgress(progress),
    nodes: roadmap.nodes.map((node) =>
      serializeRoadmapNode(node, progressByNodeId)
    ),
  };
}

async function getRoadmapNode(user, roadmapId, nodeId) {
  const roadmap = await getRoadmap(user, roadmapId);
  const node = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    include: nodeInclude,
  });

  if (!node || node.roadmapId !== roadmapId) {
    throw createAppError('Roadmap node not found', 404);
  }

  const progress = await prisma.userNodeProgress.findUnique({
    where: {
      userId_roadmapNodeId: {
        userId: user.id,
        roadmapNodeId: nodeId,
      },
    },
  });

  return {
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      slug: roadmap.slug,
    },
    node: serializeRoadmapNode(
      node,
      new Map(progress ? [[progress.roadmapNodeId, progress]] : [])
    ),
  };
}

async function createRoadmap(user, payload) {
  const slug = await createUniqueRoadmapSlug(payload.title, payload.slug);

  const roadmap = await prisma.roadmap.create({
    data: {
      title: payload.title,
      slug,
      description: payload.description,
      status: payload.status,
      createdById: user.id,
    },
    include: {
      createdBy: { select: roadmapCreatorSelect },
      nodes: {
        select: { id: true },
      },
      learnerProgress: {
        where: { userId: user.id },
        include: {
          nodeProgress: true,
        },
      },
    },
  });

  return serializeRoadmapSummary(roadmap);
}

async function addRoadmapNode(roadmapId, payload) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: { id: true },
  });

  if (!roadmap) {
    throw createAppError('Roadmap not found', 404);
  }

  const slug = await createUniqueNodeSlug(
    roadmapId,
    payload.title,
    payload.slug
  );
  const latestNode = await prisma.roadmapNode.findFirst({
    where: { roadmapId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const node = await prisma.roadmapNode.create({
    data: {
      roadmapId,
      title: payload.title,
      slug,
      summary: payload.summary,
      content: payload.content,
      order: payload.order ?? (latestNode?.order ?? -1) + 1,
    },
    include: nodeInclude,
  });

  return serializeRoadmapNode(node);
}

function addingPrerequisitesCreatesCycle(
  allNodes,
  nodeId,
  prerequisiteNodeIds
) {
  const prerequisitesByNodeId = new Map(
    allNodes.map((node) => [
      node.id,
      node.prerequisites.map((prerequisite) => prerequisite.id),
    ])
  );

  const existingPrerequisites = prerequisitesByNodeId.get(nodeId) || [];
  prerequisitesByNodeId.set(nodeId, [
    ...new Set([...existingPrerequisites, ...prerequisiteNodeIds]),
  ]);

  function canReachTarget(currentNodeId, visited = new Set()) {
    if (currentNodeId === nodeId) {
      return true;
    }

    if (visited.has(currentNodeId)) {
      return false;
    }

    visited.add(currentNodeId);

    return (prerequisitesByNodeId.get(currentNodeId) || []).some((nextNodeId) =>
      canReachTarget(nextNodeId, visited)
    );
  }

  return prerequisiteNodeIds.some((prerequisiteNodeId) =>
    canReachTarget(prerequisiteNodeId)
  );
}

async function addNodePrerequisites(roadmapId, nodeId, prerequisiteNodeIds) {
  const uniquePrerequisiteIds = unique(prerequisiteNodeIds);

  if (uniquePrerequisiteIds.includes(nodeId)) {
    throw createAppError('A node cannot be its own prerequisite', 400);
  }

  const requestedNodes = await prisma.roadmapNode.findMany({
    where: {
      id: {
        in: [nodeId, ...uniquePrerequisiteIds],
      },
    },
    include: {
      prerequisites: {
        select: { id: true },
      },
    },
  });

  const targetNode = requestedNodes.find((node) => node.id === nodeId);

  if (!targetNode || targetNode.roadmapId !== roadmapId) {
    throw createAppError('Roadmap node not found', 404);
  }

  const prerequisites = requestedNodes.filter((node) =>
    uniquePrerequisiteIds.includes(node.id)
  );

  if (
    prerequisites.length !== uniquePrerequisiteIds.length ||
    prerequisites.some((node) => node.roadmapId !== roadmapId)
  ) {
    throw createAppError(
      'Prerequisite nodes must belong to the same roadmap',
      400
    );
  }

  const roadmapNodes = await prisma.roadmapNode.findMany({
    where: { roadmapId },
    include: {
      prerequisites: {
        select: { id: true },
      },
    },
  });

  if (
    addingPrerequisitesCreatesCycle(roadmapNodes, nodeId, uniquePrerequisiteIds)
  ) {
    throw createAppError('Prerequisites cannot create a cycle', 409);
  }

  const updatedNode = await prisma.roadmapNode.update({
    where: { id: nodeId },
    data: {
      prerequisites: {
        connect: uniquePrerequisiteIds.map((id) => ({ id })),
      },
    },
    include: nodeInclude,
  });

  return serializeRoadmapNode(updatedNode);
}

async function startRoadmap(user, roadmapId) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: {
      nodes: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!roadmap || !canReadRoadmap(user, roadmap)) {
    throw createAppError('Roadmap not found', 404);
  }

  const existingProgress = await prisma.userRoadmapProgress.findUnique({
    where: {
      userId_roadmapId: {
        userId: user.id,
        roadmapId,
      },
    },
    include: progressInclude,
  });

  if (existingProgress) {
    return serializeProgress(existingProgress);
  }

  const data = {
    userId: user.id,
    roadmapId,
  };

  if (roadmap.nodes.length) {
    data.nodeProgress = {
      create: roadmap.nodes.map((node) => ({
        userId: user.id,
        roadmapNodeId: node.id,
        status: NODE_PROGRESS_STATUS.NOT_STARTED,
      })),
    };
  }

  const progress = await prisma.userRoadmapProgress.create({
    data,
    include: progressInclude,
  });

  return serializeProgress(progress);
}

function getStatusTimestamps(status, existingProgress, now) {
  if (status === NODE_PROGRESS_STATUS.NOT_STARTED) {
    return {
      startedAt: null,
      completedAt: null,
      needsRevisionAt: null,
    };
  }

  if (status === NODE_PROGRESS_STATUS.COMPLETED) {
    return {
      startedAt: existingProgress?.startedAt || now,
      completedAt: now,
      needsRevisionAt: null,
    };
  }

  if (status === NODE_PROGRESS_STATUS.NEEDS_REVISION) {
    return {
      startedAt: existingProgress?.startedAt || now,
      completedAt: null,
      needsRevisionAt: now,
    };
  }

  return {
    startedAt: existingProgress?.startedAt || now,
    completedAt: null,
    needsRevisionAt: null,
  };
}

async function assertPrerequisitesComplete(userId, node) {
  if (!node.prerequisites.length) {
    return;
  }

  const completedPrerequisites = await prisma.userNodeProgress.findMany({
    where: {
      userId,
      roadmapNodeId: {
        in: node.prerequisites.map((prerequisite) => prerequisite.id),
      },
      status: NODE_PROGRESS_STATUS.COMPLETED,
    },
    select: {
      roadmapNodeId: true,
    },
  });

  if (completedPrerequisites.length !== node.prerequisites.length) {
    throw createAppError('Complete prerequisite nodes first', 409, {
      prerequisites: node.prerequisites,
    });
  }
}

async function updateNodeProgress(user, roadmapId, nodeId, status) {
  const progress = await prisma.userRoadmapProgress.findUnique({
    where: {
      userId_roadmapId: {
        userId: user.id,
        roadmapId,
      },
    },
  });

  if (!progress) {
    throw createAppError(
      'Start this roadmap before updating node progress',
      400
    );
  }

  const node = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    include: {
      prerequisites: {
        select: nodeSummarySelect,
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!node || node.roadmapId !== roadmapId) {
    throw createAppError('Roadmap node not found', 404);
  }

  if (
    [NODE_PROGRESS_STATUS.IN_PROGRESS, NODE_PROGRESS_STATUS.COMPLETED].includes(
      status
    )
  ) {
    await assertPrerequisitesComplete(user.id, node);
  }

  const existingNodeProgress = await prisma.userNodeProgress.findUnique({
    where: {
      userId_roadmapNodeId: {
        userId: user.id,
        roadmapNodeId: nodeId,
      },
    },
  });

  const now = new Date();
  const statusTimestamps = getStatusTimestamps(
    status,
    existingNodeProgress,
    now
  );

  const nodeProgress = existingNodeProgress
    ? await prisma.userNodeProgress.update({
        where: { id: existingNodeProgress.id },
        data: {
          status,
          ...statusTimestamps,
        },
      })
    : await prisma.userNodeProgress.create({
        data: {
          userId: user.id,
          roadmapNodeId: nodeId,
          userRoadmapProgressId: progress.id,
          status,
          ...statusTimestamps,
        },
      });

  const totalNodes = await prisma.roadmapNode.count({
    where: { roadmapId },
  });
  const completedNodes = await prisma.userNodeProgress.count({
    where: {
      userId: user.id,
      status: NODE_PROGRESS_STATUS.COMPLETED,
      roadmapNode: {
        roadmapId,
      },
    },
  });
  const progressPercentage = calculateProgressPercentage(
    totalNodes,
    completedNodes
  );

  const updatedProgress = await prisma.userRoadmapProgress.update({
    where: { id: progress.id },
    data: {
      lastAccessedAt: now,
      completedAt: totalNodes > 0 && completedNodes === totalNodes ? now : null,
    },
    include: progressInclude,
  });

  return {
    progress: {
      ...serializeProgress(updatedProgress),
      totalNodes,
      completedNodes,
      progressPercentage,
    },
    nodeProgress: serializeNodeProgress(nodeProgress),
  };
}

async function listMyProgress(user) {
  const progress = await prisma.userRoadmapProgress.findMany({
    where: { userId: user.id },
    include: {
      roadmap: {
        include: {
          nodes: {
            select: { id: true },
          },
          createdBy: {
            select: roadmapCreatorSelect,
          },
        },
      },
      nodeProgress: true,
    },
    orderBy: { lastAccessedAt: 'desc' },
  });

  return progress.map((item) => ({
    roadmap: serializeRoadmapSummary({
      ...item.roadmap,
      learnerProgress: [item],
    }),
    progress: serializeProgress(item),
  }));
}

module.exports = {
  listRoadmaps,
  getRoadmap,
  getRoadmapNode,
  createRoadmap,
  addRoadmapNode,
  addNodePrerequisites,
  startRoadmap,
  updateNodeProgress,
  listMyProgress,
  calculateProgressPercentage,
};
