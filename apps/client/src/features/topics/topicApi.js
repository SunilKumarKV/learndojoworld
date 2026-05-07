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

export async function fetchTopics(accessToken, filters = {}) {
  const response = await apiClient.get('/topics', {
    ...authHeader(accessToken),
    params: filters,
  });
  return unwrap(response);
}

export async function fetchTopic(accessToken, topicId) {
  const response = await apiClient.get(
    `/topics/${topicId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}
