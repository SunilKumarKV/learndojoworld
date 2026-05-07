const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { ROLES } = require('../auth/auth.constants');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getMyRoadmapProgress,
  getRoadmapDetail,
  getRoadmapNodeDetail,
  getRoadmaps,
  patchNodeProgress,
  postNodePrerequisites,
  postRoadmap,
  postRoadmapNode,
  postStartRoadmap,
} = require('./roadmap.controller');
const {
  addPrerequisitesSchema,
  createRoadmapNodeSchema,
  createRoadmapSchema,
  roadmapNodeParamsSchema,
  roadmapParamsSchema,
  updateNodeProgressSchema,
} = require('./roadmap.validation');

const router = express.Router();
const canManageRoadmaps = authorizeRoles(ROLES.ADMIN, ROLES.CREATOR);
const canLearnRoadmaps = authorizeRoles(ROLES.LEARNER);

router.use(authenticate);

router.get('/', asyncHandler(getRoadmaps));
router.post(
  '/',
  canManageRoadmaps,
  validateRequest(createRoadmapSchema),
  asyncHandler(postRoadmap)
);

router.get('/my-progress', asyncHandler(getMyRoadmapProgress));

router.get(
  '/:roadmapId',
  validateRequest(roadmapParamsSchema, 'params'),
  asyncHandler(getRoadmapDetail)
);
router.post(
  '/:roadmapId/start',
  canLearnRoadmaps,
  validateRequest(roadmapParamsSchema, 'params'),
  asyncHandler(postStartRoadmap)
);
router.post(
  '/:roadmapId/nodes',
  canManageRoadmaps,
  validateRequest(roadmapParamsSchema, 'params'),
  validateRequest(createRoadmapNodeSchema),
  asyncHandler(postRoadmapNode)
);
router.get(
  '/:roadmapId/nodes/:nodeId',
  validateRequest(roadmapNodeParamsSchema, 'params'),
  asyncHandler(getRoadmapNodeDetail)
);
router.post(
  '/:roadmapId/nodes/:nodeId/prerequisites',
  canManageRoadmaps,
  validateRequest(roadmapNodeParamsSchema, 'params'),
  validateRequest(addPrerequisitesSchema),
  asyncHandler(postNodePrerequisites)
);
router.patch(
  '/:roadmapId/nodes/:nodeId/progress',
  canLearnRoadmaps,
  validateRequest(roadmapNodeParamsSchema, 'params'),
  validateRequest(updateNodeProgressSchema),
  asyncHandler(patchNodeProgress)
);

module.exports = router;
