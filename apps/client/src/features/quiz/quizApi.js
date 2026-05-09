import { apiClient } from '../../lib/apiClient';

function authHeader(accessToken) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function unwrap(response) {
  return response.data.data;
}

export async function createQuiz(accessToken, payload) {
  const response = await apiClient.post('/quizzes', payload, authHeader(accessToken));
  return unwrap(response);
}

export async function getQuiz(accessToken, quizId) {
  const response = await apiClient.get(`/quizzes/${quizId}`, authHeader(accessToken));
  return unwrap(response);
}

export async function startQuizAttempt(accessToken, quizId) {
  const response = await apiClient.post(
    `/quizzes/${quizId}/attempts`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function submitAnswer(accessToken, quizId, attemptId, answer) {
  const response = await apiClient.post(
    `/quizzes/${quizId}/attempts/${attemptId}/answers`,
    answer,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function submitQuizAttempt(accessToken, quizId, attemptId) {
  const response = await apiClient.post(
    `/quizzes/${quizId}/attempts/${attemptId}/submit`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function getAttemptResult(accessToken, quizId, attemptId) {
  const response = await apiClient.get(
    `/quizzes/${quizId}/attempts/${attemptId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function getMyAttempts(accessToken, quizId) {
  const response = await apiClient.get(
    `/quizzes/${quizId}/my-attempts`,
    authHeader(accessToken)
  );
  return unwrap(response);
}
