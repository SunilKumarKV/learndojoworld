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

export async function register(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return unwrap(response);
}

export async function login(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return unwrap(response);
}

export async function logout(refreshToken) {
  const response = await apiClient.post('/auth/logout', { refreshToken });
  return unwrap(response);
}

export async function refresh(refreshToken) {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return unwrap(response);
}

export async function getCurrentUser(accessToken) {
  const response = await apiClient.get('/auth/me', authHeader(accessToken));
  return unwrap(response);
}
