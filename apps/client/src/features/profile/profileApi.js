import { apiClient } from '../../lib/apiClient';

function authHeader(accessToken) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

function unwrap(response) {
  return response.data.data;
}

export async function fetchMyProfile(accessToken) {
  const response = await apiClient.get('/profiles/me', authHeader(accessToken));
  return unwrap(response).profile;
}

export async function updateMyProfile(accessToken, payload) {
  const response = await apiClient.patch('/profiles/me', payload, authHeader(accessToken));
  return unwrap(response).profile;
}

export async function discoverProfiles(accessToken, search = '') {
  const response = await apiClient.get('/profiles/discover', {
    ...authHeader(accessToken),
    params: search ? { search } : undefined,
  });
  return unwrap(response).profiles;
}

export async function followProfile(accessToken, userId) {
  const response = await apiClient.post(`/profiles/${userId}/follow`, {}, authHeader(accessToken));
  return unwrap(response);
}

export async function unfollowProfile(accessToken, userId) {
  const response = await apiClient.delete(`/profiles/${userId}/follow`, authHeader(accessToken));
  return unwrap(response);
}

export async function fetchFollowers(accessToken, userId) {
  const response = await apiClient.get(`/profiles/${userId}/followers`, authHeader(accessToken));
  return unwrap(response).profiles;
}

export async function fetchFollowing(accessToken, userId) {
  const response = await apiClient.get(`/profiles/${userId}/following`, authHeader(accessToken));
  return unwrap(response).profiles;
}
