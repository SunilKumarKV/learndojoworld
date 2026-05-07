// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TopicsList from './TopicsList';
import { fetchTopics } from '../features/topics/topicApi';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'access-token' },
    user: {
      id: 'learner_1',
      email: 'learner@example.com',
      role: 'LEARNER',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../features/topics/topicApi', () => ({
  fetchTopics: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <TopicsList />
    </MemoryRouter>
  );
}

describe('TopicsList', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders approved topic cards', async () => {
    fetchTopics.mockResolvedValue({
      topics: [
        {
          id: 'topic_1',
          title: 'HTML Introduction',
          summary: 'Learn the purpose of HTML',
          status: 'PUBLISHED',
          blockCount: 8,
          roadmapNode: {
            title: 'HTML basics',
          },
        },
      ],
    });

    renderPage();

    expect(await screen.findByText('HTML Introduction')).toBeInTheDocument();
    expect(screen.getByText('Learn the purpose of HTML')).toBeInTheDocument();
    expect(screen.getByText('Linked to HTML basics')).toBeInTheDocument();
  });
});
