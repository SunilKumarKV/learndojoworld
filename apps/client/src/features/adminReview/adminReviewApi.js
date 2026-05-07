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

export async function fetchReviewQueue(accessToken, filters = {}) {
  const response = await apiClient.get('/admin/review/queue', {
    ...authHeader(accessToken),
    params: filters,
  });
  return unwrap(response);
}

export async function fetchReviewContent(accessToken, contentType, contentId) {
  const response = await apiClient.get(
    `/admin/review/content/${contentType}/${contentId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function approveContent(accessToken, contentType, contentId) {
  const response = await apiClient.post(
    `/admin/review/content/${contentType}/${contentId}/approve`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function rejectContent(
  accessToken,
  contentType,
  contentId,
  reason
) {
  const response = await apiClient.post(
    `/admin/review/content/${contentType}/${contentId}/reject`,
    { reason },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function publishContent(accessToken, contentType, contentId) {
  const response = await apiClient.post(
    `/admin/review/content/${contentType}/${contentId}/publish`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function flagContent(accessToken, contentType, contentId, reason) {
  const response = await apiClient.post(
    `/admin/review/content/${contentType}/${contentId}/flag`,
    { reason },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchCreators(accessToken) {
  const response = await apiClient.get(
    '/admin/review/creators',
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchCreator(accessToken, creatorId) {
  const response = await apiClient.get(
    `/admin/review/creators/${creatorId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}
