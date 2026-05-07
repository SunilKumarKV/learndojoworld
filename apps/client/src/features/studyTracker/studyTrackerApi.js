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

export async function fetchStudyDashboard(accessToken) {
  const response = await apiClient.get(
    '/study-tracker/dashboard',
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createStudyPlan(accessToken, payload) {
  const response = await apiClient.post(
    '/study-tracker/plans',
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function updateStudyPlanStatus(accessToken, planId, status) {
  const response = await apiClient.patch(
    `/study-tracker/plans/${planId}`,
    { status },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function startStudySession(accessToken, payload = {}) {
  const response = await apiClient.post(
    '/study-tracker/sessions',
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function completeStudySession(
  accessToken,
  sessionId,
  payload = {}
) {
  const response = await apiClient.patch(
    `/study-tracker/sessions/${sessionId}/complete`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function updateRevisionItem(accessToken, revisionId, payload) {
  const response = await apiClient.patch(
    `/study-tracker/revisions/${revisionId}`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}
