// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminContentPreview from './AdminContentPreview';
import AdminReviewQueue from './AdminReviewQueue';
import {
  fetchReviewContent,
  fetchReviewQueue,
} from '../features/adminReview/adminReviewApi';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'access-token' },
    user: {
      id: 'admin_1',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../features/adminReview/adminReviewApi', () => ({
  fetchReviewQueue: vi.fn(),
  fetchReviewContent: vi.fn(),
  approveContent: vi.fn(),
  rejectContent: vi.fn(),
  publishContent: vi.fn(),
  flagContent: vi.fn(),
}));

function renderWithRouter(ui, initialEntries = ['/admin/review']) {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      {ui}
    </MemoryRouter>
  );
}

describe('Admin review pages', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the submitted review queue', async () => {
    fetchReviewQueue.mockResolvedValue({
      items: [
        {
          id: 'course_1',
          contentType: 'COURSE',
          contentTypeParam: 'course',
          title: 'Frontend Foundations',
          summary: 'HTML to React',
          status: 'SUBMITTED',
          creator: {
            name: 'Creator User',
            email: 'creator@example.com',
          },
          moduleCount: 2,
          lessonCount: 4,
          quizCount: 1,
        },
      ],
    });

    renderWithRouter(<AdminReviewQueue />);

    expect(await screen.findByText('Frontend Foundations')).toBeInTheDocument();
    expect(screen.getAllByText('Submitted')).not.toHaveLength(0);
    expect(screen.getByText('Creator: Creator User')).toBeInTheDocument();
  });

  it('renders preview, timeline, and rejection modal', async () => {
    fetchReviewContent.mockResolvedValue({
      item: {
        id: 'topic_1',
        contentType: 'TOPIC_PAGE',
        contentTypeParam: 'topic',
        title: 'HTML Introduction',
        summary: 'Learn HTML',
        status: 'SUBMITTED',
        creator: {
          id: 'creator_1',
          name: 'Creator User',
          email: 'creator@example.com',
        },
        blocks: [
          {
            id: 'block_1',
            type: 'PARAGRAPH',
            content: 'HTML gives pages structure.',
          },
        ],
      },
      timeline: [
        {
          id: 'event_1',
          fromStatus: null,
          toStatus: 'DRAFT',
          actor: {
            name: 'Creator User',
            email: 'creator@example.com',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'event_2',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          actor: {
            name: 'Creator User',
            email: 'creator@example.com',
          },
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    renderWithRouter(
      <Routes>
        <Route
          path="/admin/review/:contentType/:contentId"
          element={<AdminContentPreview />}
        />
      </Routes>,
      ['/admin/review/topic/topic_1']
    );

    expect(await screen.findAllByText('HTML Introduction')).not.toHaveLength(0);
    expect(screen.getByText('Content status timeline')).toBeInTheDocument();
    expect(screen.getByText('HTML gives pages structure.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(screen.getByText('Reject content')).toBeInTheDocument();
  });
});
