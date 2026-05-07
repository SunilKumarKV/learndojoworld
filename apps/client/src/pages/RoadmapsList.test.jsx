// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RoadmapsList from './RoadmapsList';
import { fetchRoadmaps } from '../features/roadmaps/roadmapApi';

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

vi.mock('../features/roadmaps/roadmapApi', () => ({
  fetchRoadmaps: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <RoadmapsList />
    </MemoryRouter>
  );
}

describe('RoadmapsList', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders roadmap cards with progress', async () => {
    fetchRoadmaps.mockResolvedValue({
      roadmaps: [
        {
          id: 'roadmap_1',
          title: 'Frontend Fundamentals',
          description: 'Learn frontend foundations',
          status: 'PUBLISHED',
          totalNodes: 4,
          progressPercentage: 25,
        },
      ],
    });

    renderPage();

    expect(
      await screen.findByText('Frontend Fundamentals')
    ).toBeInTheDocument();
    expect(screen.getByText('Learn frontend foundations')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});
