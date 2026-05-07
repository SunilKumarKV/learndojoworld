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

export async function fetchDoubts(accessToken, filters) {
  const response = await apiClient.get('/doubts', {
    ...authHeader(accessToken),
    params: filters,
  });
  return unwrap(response);
}

export async function createDoubt(accessToken, payload) {
  const response = await apiClient.post(
    '/doubts',
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createDoubtReply(accessToken, doubtId, payload) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/replies`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function markOfficialAnswer(accessToken, doubtId, replyId) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/replies/${replyId}/official`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function acceptDoubtAnswer(accessToken, doubtId, replyId) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/replies/${replyId}/accept`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function upvoteDoubt(accessToken, doubtId) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/upvote`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function upvoteDoubtReply(accessToken, doubtId, replyId) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/replies/${replyId}/upvote`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function reportDoubt(accessToken, doubtId, reason) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/report`,
    { reason },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function reportDoubtReply(accessToken, doubtId, replyId, reason) {
  const response = await apiClient.post(
    `/doubts/${doubtId}/replies/${replyId}/report`,
    { reason },
    authHeader(accessToken)
  );
  return unwrap(response);
}
