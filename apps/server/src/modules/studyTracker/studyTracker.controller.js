const { successResponse } = require('../../utils/apiResponse');
const {
  completeStudySession,
  createRevisionItem,
  createStudyPlan,
  getStudyDashboard,
  startStudySession,
  updateRevisionItem,
  updateStudyPlan,
} = require('./studyTracker.service');

async function getDashboard(req, res) {
  const dashboard = await getStudyDashboard(req.user, req.query);
  return successResponse(res, dashboard, 'StudyTracker dashboard retrieved');
}

async function postStudyPlan(req, res) {
  const plan = await createStudyPlan(req.user, req.body);
  return successResponse(res, { plan }, 'Study plan created', 201);
}

async function patchStudyPlan(req, res) {
  const plan = await updateStudyPlan(req.user, req.params.planId, req.body);
  return successResponse(res, { plan }, 'Study plan updated');
}

async function postStudySession(req, res) {
  const session = await startStudySession(req.user, req.body);
  return successResponse(res, { session }, 'Study session started', 201);
}

async function patchStudySessionComplete(req, res) {
  const result = await completeStudySession(
    req.user,
    req.params.sessionId,
    req.body
  );
  return successResponse(res, result, 'Study session completed');
}

async function postRevisionItem(req, res) {
  const revisionItem = await createRevisionItem(req.user, req.body);
  return successResponse(res, { revisionItem }, 'Revision item created', 201);
}

async function patchRevisionItem(req, res) {
  const revisionItem = await updateRevisionItem(
    req.user,
    req.params.revisionId,
    req.body
  );
  return successResponse(res, { revisionItem }, 'Revision item updated');
}

module.exports = {
  getDashboard,
  postStudyPlan,
  patchStudyPlan,
  postStudySession,
  patchStudySessionComplete,
  postRevisionItem,
  patchRevisionItem,
};
