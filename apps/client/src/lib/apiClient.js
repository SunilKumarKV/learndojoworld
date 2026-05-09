import axios from 'axios';

const API_BASE_URL =
import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';

    error.userMessage = message;
    return Promise.reject(error);
  }
);