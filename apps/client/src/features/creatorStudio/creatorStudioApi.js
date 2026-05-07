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

export async function fetchCreatorDashboard(accessToken) {
  const response = await apiClient.get(
    '/creator-studio/dashboard',
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchCreatorCourses(accessToken) {
  const response = await apiClient.get(
    '/creator-studio/courses',
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchCreatorCourse(accessToken, courseId) {
  const response = await apiClient.get(
    `/creator-studio/courses/${courseId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createCreatorCourse(accessToken, payload) {
  const response = await apiClient.post(
    '/creator-studio/courses',
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createCourseModule(accessToken, courseId, payload) {
  const response = await apiClient.post(
    `/creator-studio/courses/${courseId}/modules`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createLesson(accessToken, moduleId, payload) {
  const response = await apiClient.post(
    `/creator-studio/modules/${moduleId}/lessons`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function fetchCreatorLesson(accessToken, lessonId) {
  const response = await apiClient.get(
    `/creator-studio/lessons/${lessonId}`,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function updateLesson(accessToken, lessonId, payload) {
  const response = await apiClient.patch(
    `/creator-studio/lessons/${lessonId}`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function addLessonNotes(accessToken, lessonId, blocks) {
  const response = await apiClient.post(
    `/creator-studio/lessons/${lessonId}/notes`,
    { blocks },
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function saveLessonQuiz(accessToken, lessonId, payload) {
  const response = await apiClient.post(
    `/creator-studio/lessons/${lessonId}/quiz`,
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function createCreatorTopic(accessToken, payload) {
  const response = await apiClient.post(
    '/creator-studio/topics',
    payload,
    authHeader(accessToken)
  );
  return unwrap(response);
}

export async function submitCourseForReview(accessToken, courseId) {
  const response = await apiClient.post(
    `/creator-studio/courses/${courseId}/submit-review`,
    {},
    authHeader(accessToken)
  );
  return unwrap(response);
}
