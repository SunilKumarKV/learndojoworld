const { successResponse } = require('../../utils/apiResponse');
const {
  createQuiz,
  getQuiz,
  startQuizAttempt,
  submitQuizAnswer,
  submitQuizAttempt,
  getQuizAttempt,
  getMyQuizAttempts,
} = require('./quiz.service');

async function postQuiz(req, res) {
  const quiz = await createQuiz(req.user, req.body);
  res.status(201).json(successResponse('Quiz created', { quiz }));
}

async function getQuizDetail(req, res) {
  const quiz = await getQuiz(req.user, req.params.quizId);
  res.json(successResponse('Quiz retrieved', { quiz }));
}

async function postQuizAttempt(req, res) {
  const attempt = await startQuizAttempt(req.user, req.params.quizId);
  res.status(201).json(successResponse('Quiz attempt started', { attempt }));
}

async function postQuizAnswer(req, res) {
  const answer = await submitQuizAnswer(
    req.user,
    req.params.quizId,
    req.params.attemptId,
    req.body
  );
  res.json(successResponse('Answer submitted', { answer }));
}

async function postSubmitQuizAttempt(req, res) {
  const attempt = await submitQuizAttempt(
    req.user,
    req.params.quizId,
    req.params.attemptId
  );
  res.json(successResponse('Quiz attempt submitted', { attempt }));
}

async function getQuizAttemptDetail(req, res) {
  const attempt = await getQuizAttempt(
    req.user,
    req.params.quizId,
    req.params.attemptId
  );
  res.json(successResponse('Attempt retrieved', { attempt }));
}

async function getMyAttempts(req, res) {
  const attempts = await getMyQuizAttempts(req.user, req.params.quizId);
  res.json(successResponse('Attempts retrieved', { attempts }));
}

module.exports = {
  postQuiz,
  getQuizDetail,
  postQuizAttempt,
  postQuizAnswer,
  postSubmitQuizAttempt,
  getQuizAttemptDetail,
  getMyAttempts,
};
