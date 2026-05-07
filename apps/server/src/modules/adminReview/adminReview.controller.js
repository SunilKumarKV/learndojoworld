const { successResponse } = require('../../utils/apiResponse');
const { REVIEW_STATUS } = require('./adminReview.constants');
const {
  getContentPreview,
  getCreatorDetails,
  listCreators,
  listReviewQueue,
  updateContentStatus,
} = require('./adminReview.service');

async function getReviewQueue(req, res) {
  const items = await listReviewQueue(req.query);
  return successResponse(res, { items }, 'Review queue retrieved');
}

async function getReviewContent(req, res) {
  const preview = await getContentPreview(
    req.params.contentType,
    req.params.contentId
  );
  return successResponse(res, preview, 'Review content retrieved');
}

async function postApproveContent(req, res) {
  const preview = await updateContentStatus(
    req.user,
    req.params.contentType,
    req.params.contentId,
    REVIEW_STATUS.APPROVED
  );
  return successResponse(res, preview, 'Content approved');
}

async function postRejectContent(req, res) {
  const preview = await updateContentStatus(
    req.user,
    req.params.contentType,
    req.params.contentId,
    REVIEW_STATUS.REJECTED,
    req.body.reason
  );
  return successResponse(res, preview, 'Content rejected');
}

async function postPublishContent(req, res) {
  const preview = await updateContentStatus(
    req.user,
    req.params.contentType,
    req.params.contentId,
    REVIEW_STATUS.PUBLISHED
  );
  return successResponse(res, preview, 'Content published');
}

async function postFlagContent(req, res) {
  const preview = await updateContentStatus(
    req.user,
    req.params.contentType,
    req.params.contentId,
    REVIEW_STATUS.FLAGGED,
    req.body.reason
  );
  return successResponse(res, preview, 'Content flagged');
}

async function getCreators(req, res) {
  const creators = await listCreators();
  return successResponse(res, { creators }, 'Creators retrieved');
}

async function getCreator(req, res) {
  const creator = await getCreatorDetails(req.params.creatorId);
  return successResponse(res, { creator }, 'Creator retrieved');
}

module.exports = {
  getReviewQueue,
  getReviewContent,
  postApproveContent,
  postRejectContent,
  postPublishContent,
  postFlagContent,
  getCreators,
  getCreator,
};
