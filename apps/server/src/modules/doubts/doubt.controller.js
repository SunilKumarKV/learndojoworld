const { successResponse } = require('../../utils/apiResponse');
const {
  acceptAnswer,
  createDoubt,
  createDoubtReply,
  listDoubts,
  listModerationReports,
  markOfficialAnswer,
  moderateDoubt,
  moderateReply,
  reportDoubt,
  reportReply,
  reviewReport,
  toggleDoubtVote,
  toggleReplyVote,
} = require('./doubt.service');

async function getDoubts(req, res) {
  const doubts = await listDoubts(req.user, req.query);
  return successResponse(res, { doubts }, 'Doubts retrieved');
}

async function postDoubt(req, res) {
  const doubt = await createDoubt(req.user, req.body);
  return successResponse(res, { doubt }, 'Doubt created', 201);
}

async function postReply(req, res) {
  const reply = await createDoubtReply(req.user, req.params.doubtId, req.body);
  return successResponse(res, { reply }, 'Reply added', 201);
}

async function postOfficialAnswer(req, res) {
  const reply = await markOfficialAnswer(
    req.user,
    req.params.doubtId,
    req.params.replyId
  );
  return successResponse(res, { reply }, 'Official answer marked');
}

async function postAcceptedAnswer(req, res) {
  const doubt = await acceptAnswer(
    req.user,
    req.params.doubtId,
    req.params.replyId
  );
  return successResponse(res, { doubt }, 'Accepted answer marked');
}

async function postDoubtVote(req, res) {
  const vote = await toggleDoubtVote(req.user, req.params.doubtId);
  return successResponse(res, { vote }, 'Doubt vote updated');
}

async function postReplyVote(req, res) {
  const vote = await toggleReplyVote(
    req.user,
    req.params.doubtId,
    req.params.replyId
  );
  return successResponse(res, { vote }, 'Reply vote updated');
}

async function postDoubtReport(req, res) {
  const report = await reportDoubt(req.user, req.params.doubtId, req.body);
  return successResponse(res, { report }, 'Doubt reported', 201);
}

async function postReplyReport(req, res) {
  const report = await reportReply(
    req.user,
    req.params.doubtId,
    req.params.replyId,
    req.body
  );
  return successResponse(res, { report }, 'Reply reported', 201);
}

async function getModerationReports(req, res) {
  const reports = await listModerationReports(req.query);
  return successResponse(res, { reports }, 'Doubt reports retrieved');
}

async function patchModeratedDoubt(req, res) {
  const doubt = await moderateDoubt(req.params.doubtId, req.body);
  return successResponse(res, { doubt }, 'Doubt moderated');
}

async function patchModeratedReply(req, res) {
  const reply = await moderateReply(req.params.replyId, req.body);
  return successResponse(res, { reply }, 'Reply moderated');
}

async function patchReportReview(req, res) {
  const report = await reviewReport(req.user, req.params.reportId, req.body);
  return successResponse(res, { report }, 'Report reviewed');
}

module.exports = {
  getDoubts,
  postDoubt,
  postReply,
  postOfficialAnswer,
  postAcceptedAnswer,
  postDoubtVote,
  postReplyVote,
  postDoubtReport,
  postReplyReport,
  getModerationReports,
  patchModeratedDoubt,
  patchModeratedReply,
  patchReportReview,
};
