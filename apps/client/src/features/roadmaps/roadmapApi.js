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

export async function fetchRoadmaps(accessToken) {
  const response = await apiClient.get('/roadmaps', authHeader(accessToken));
  return unwrap(response);
}

export async function fetchRoadmap(accessToken, roadmapId) {
  const response = await apiClient.get(
    `/roadmaps/${roadmapId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchRoadmapNode(accessToken, roadmapId, nodeId) {
  const response = await apiClient.get(
    `/roadmaps/${roadmapId}/nodes/${nodeId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function startRoadmap(accessToken, roadmapId) {
  const response = await apiClient.post(
    `/roadmaps/${roadmapId}/start`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function updateNodeProgress(
  accessToken,
  roadmapId,
  nodeId,
  status
) {
  const response = await apiClient.patch(
    `/roadmaps/${roadmapId}/nodes/${nodeId}/progress`,
    { status },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchMyProgress(accessToken) {
  const response = await apiClient.get(
    '/roadmaps/my-progress',
    authHeader(accessToken)
  );
  return unwrap(response);
}
