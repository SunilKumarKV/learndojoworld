const { successResponse } = require('../../utils/apiResponse');
const {
  addNodePrerequisites,
  addRoadmapNode,
  createRoadmap,
  getRoadmap,
  getRoadmapNode,
  listMyProgress,
  listRoadmaps,
  startRoadmap,
  updateNodeProgress,
} = require('./roadmap.service');

async function getRoadmaps(req, res) {
  const roadmaps = await listRoadmaps(req.user);
  return successResponse(res, { roadmaps }, 'Roadmaps retrieved');
}

async function getMyRoadmapProgress(req, res) {
  const progress = await listMyProgress(req.user);
  return successResponse(res, { progress }, 'Learning progress retrieved');
}

async function getRoadmapDetail(req, res) {
  const roadmap = await getRoadmap(req.user, req.params.roadmapId);
  return successResponse(res, { roadmap }, 'Roadmap retrieved');
}

async function getRoadmapNodeDetail(req, res) {
  const node = await getRoadmapNode(
    req.user,
    req.params.roadmapId,
    req.params.nodeId
  );
  return successResponse(res, node, 'Roadmap node retrieved');
}

async function postRoadmap(req, res) {
  const roadmap = await createRoadmap(req.user, req.body);
  return successResponse(res, { roadmap }, 'Roadmap created', 201);
}

async function postRoadmapNode(req, res) {
  const node = await addRoadmapNode(req.params.roadmapId, req.body);
  return successResponse(res, { node }, 'Roadmap node created', 201);
}

async function postNodePrerequisites(req, res) {
  const node = await addNodePrerequisites(
    req.params.roadmapId,
    req.params.nodeId,
    req.body.prerequisiteNodeIds
  );
  return successResponse(res, { node }, 'Prerequisites added');
}

async function postStartRoadmap(req, res) {
  const progress = await startRoadmap(req.user, req.params.roadmapId);
  return successResponse(res, { progress }, 'Roadmap started', 201);
}

async function patchNodeProgress(req, res) {
  const progress = await updateNodeProgress(
    req.user,
    req.params.roadmapId,
    req.params.nodeId,
    req.body.status
  );
  return successResponse(res, progress, 'Node progress updated');
}

module.exports = {
  getRoadmaps,
  getMyRoadmapProgress,
  getRoadmapDetail,
  getRoadmapNodeDetail,
  postRoadmap,
  postRoadmapNode,
  postNodePrerequisites,
  postStartRoadmap,
  patchNodeProgress,
};
