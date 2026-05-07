const { successResponse } = require('../../utils/apiResponse');
const {
  addContentBlocks,
  approveTopic,
  createTopic,
  getTopic,
  listTopics,
  submitTopicForReview,
} = require('./topic.service');

async function getTopics(req, res) {
  const topics = await listTopics(req.user, req.query);
  return successResponse(res, { topics }, 'Topics retrieved');
}

async function getTopicDetail(req, res) {
  const topic = await getTopic(req.user, req.params.topicId);
  return successResponse(res, { topic }, 'Topic retrieved');
}

async function postTopic(req, res) {
  const topic = await createTopic(req.user, req.body);
  return successResponse(res, { topic }, 'Topic created', 201);
}

async function postContentBlocks(req, res) {
  const result = await addContentBlocks(
    req.user,
    req.params.topicId,
    req.body.blocks
  );
  return successResponse(res, result, 'Content blocks added', 201);
}

async function postSubmitForReview(req, res) {
  const topic = await submitTopicForReview(req.user, req.params.topicId);
  return successResponse(res, { topic }, 'Topic submitted for review');
}

async function postApproveTopic(req, res) {
  const topic = await approveTopic(req.user, req.params.topicId);
  return successResponse(res, { topic }, 'Topic approved');
}

module.exports = {
  getTopics,
  getTopicDetail,
  postTopic,
  postContentBlocks,
  postSubmitForReview,
  postApproveTopic,
};
