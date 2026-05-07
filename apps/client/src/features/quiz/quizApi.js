import apiClient from '../../lib/apiClient';

export async function createQuiz(accessToken, payload) {
  const response = await apiClient.post('/api/v1/quizzes', payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.data;
}

export async function getQuiz(accessToken, quizId) {
  const response = await apiClient.get(`/api/v1/quizzes/${quizId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.data;
}

export async function startQuizAttempt(accessToken, quizId) {
  const response = await apiClient.post(
    `/api/v1/quizzes/${quizId}/attempts`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.data;
}

export async function submitAnswer(accessToken, quizId, attemptId, answer) {
  const response = await apiClient.post(
    `/api/v1/quizzes/${quizId}/attempts/${attemptId}/answers`,
    answer,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.data;
}

export async function submitQuizAttempt(accessToken, quizId, attemptId) {
  const response = await apiClient.post(
    `/api/v1/quizzes/${quizId}/attempts/${attemptId}/submit`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.data;
}

export async function getAttemptResult(accessToken, quizId, attemptId) {
  const response = await apiClient.get(
    `/api/v1/quizzes/${quizId}/attempts/${attemptId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.data;
}

export async function getMyAttempts(accessToken, quizId) {
  const response = await apiClient.get(
    `/api/v1/quizzes/${quizId}/my-attempts`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data.data;
}
