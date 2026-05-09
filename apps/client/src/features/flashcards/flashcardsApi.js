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

export async function fetchFlashcardsDue(accessToken, date) {
  const response = await apiClient.get('/flashcards/due', {
    ...authHeader(accessToken),
    params: { date },
  });
  return unwrap(response);
}

export async function createFlashcard(accessToken, payload) {
  const response = await apiClient.post('/flashcards', payload, authHeader(accessToken));
  return unwrap(response);
}

export async function reviewFlashcard(accessToken, flashcardId, grade) {
  const response = await apiClient.post(
    `/flashcards/${flashcardId}/review`,
    { grade },
    authHeader(accessToken)
  );
  return unwrap(response);
}
