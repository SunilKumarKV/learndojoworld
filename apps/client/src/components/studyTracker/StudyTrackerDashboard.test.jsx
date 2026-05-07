// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyTrackerDashboard from './StudyTrackerDashboard';
import {
  fetchStudyDashboard,
  updateStudyPlanStatus,
} from '../../features/studyTracker/studyTrackerApi';

vi.mock('../../features/auth/AuthContext', () => ({
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

vi.mock('../../features/studyTracker/studyTrackerApi', () => ({
  completeStudySession: vi.fn(),
  fetchStudyDashboard: vi.fn(),
  startStudySession: vi.fn(),
  updateRevisionItem: vi.fn(),
  updateStudyPlanStatus: vi.fn(),
}));

const dashboard = {
  today: {
    date: '2026-05-07',
    plan: [
      {
        id: 'plan_1',
        title: 'Continue HTML basics',
        plannedDate: '2026-05-07T00:00:00.000Z',
        estimatedMinutes: 30,
        status: 'PLANNED',
        completedAt: null,
        roadmap: {
          id: 'roadmap_1',
          title: 'Frontend Fundamentals',
        },
        roadmapNode: {
          id: 'node_1',
          title: 'HTML basics',
        },
      },
    ],
  },
  continueLearning: [
    {
      progressId: 'progress_1',
      roadmap: {
        id: 'roadmap_1',
        title: 'Frontend Fundamentals',
      },
      nextNode: {
        id: 'node_1',
        title: 'HTML basics',
      },
      completedNodes: 1,
      totalNodes: 4,
      progressPercentage: 25,
    },
  ],
  revisionDue: [
    {
      id: 'revision_1',
      title: 'Review HTML tags',
      dueAt: '2026-05-07T10:00:00.000Z',
      status: 'DUE',
    },
  ],
  weakTopics: [
    {
      id: 'node_progress_1',
      roadmapNode: {
        id: 'node_1',
        roadmapId: 'roadmap_1',
        title: 'HTML basics',
        roadmap: {
          title: 'Frontend Fundamentals',
        },
      },
    },
  ],
  weeklyProgress: [
    { date: '2026-05-01', studyMinutes: 20, completedNodes: 1 },
    { date: '2026-05-02', studyMinutes: 0, completedNodes: 0 },
    { date: '2026-05-03', studyMinutes: 30, completedNodes: 1 },
    { date: '2026-05-04', studyMinutes: 10, completedNodes: 0 },
    { date: '2026-05-05', studyMinutes: 45, completedNodes: 2 },
    { date: '2026-05-06', studyMinutes: 25, completedNodes: 1 },
    { date: '2026-05-07', studyMinutes: 40, completedNodes: 1 },
  ],
  activeSession: null,
  streak: {
    current: 4,
    longest: 8,
    lastStudiedAt: '2026-05-07T09:00:00.000Z',
  },
  studyTime: {
    todayMinutes: 40,
    weekMinutes: 170,
    totalMinutes: 640,
  },
};

function renderDashboard() {
  return render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <StudyTrackerDashboard />
    </MemoryRouter>
  );
}

describe('StudyTrackerDashboard', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchStudyDashboard.mockResolvedValue(dashboard);
    updateStudyPlanStatus.mockResolvedValue({
      plan: {
        ...dashboard.today.plan[0],
        status: 'COMPLETED',
      },
    });
  });

  it('renders learner StudyTracker cards', async () => {
    renderDashboard();

    expect(await screen.findByText("Today's plan")).toBeInTheDocument();
    expect(screen.getByText('Continue HTML basics')).toBeInTheDocument();
    expect(screen.getAllByText('Frontend Fundamentals').length).toBeGreaterThan(
      0
    );
    expect(screen.getByText('Review HTML tags')).toBeInTheDocument();
    expect(screen.getByText('Weak topics')).toBeInTheDocument();
    expect(screen.getByText('Weekly progress')).toBeInTheDocument();
    expect(screen.getByText('4 days')).toBeInTheDocument();
  });

  it('marks a plan item complete', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(await screen.findByRole('button', { name: /mark done/i }));

    expect(updateStudyPlanStatus).toHaveBeenCalledWith(
      'access-token',
      'plan_1',
      'COMPLETED'
    );
    expect(fetchStudyDashboard).toHaveBeenCalledTimes(2);
  });
});
