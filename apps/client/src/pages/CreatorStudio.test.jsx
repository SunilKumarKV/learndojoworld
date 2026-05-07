// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreatorDashboard from './CreatorDashboard';
import LessonEditor from './LessonEditor';
import {
  fetchCreatorDashboard,
  fetchCreatorLesson,
} from '../features/creatorStudio/creatorStudioApi';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'access-token' },
    user: {
      id: 'creator_1',
      email: 'creator@example.com',
      role: 'CREATOR',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../features/creatorStudio/creatorStudioApi', () => ({
  fetchCreatorDashboard: vi.fn(),
  fetchCreatorLesson: vi.fn(),
  updateLesson: vi.fn(),
  addLessonNotes: vi.fn(),
  saveLessonQuiz: vi.fn(),
}));

function renderWithRouter(ui, initialEntries = ['/creator']) {
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

describe('Creator Studio pages', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard metrics and recent courses', async () => {
    fetchCreatorDashboard.mockResolvedValue({
      stats: {
        courses: 1,
        modules: 2,
        lessons: 3,
        pendingReview: 1,
        published: 0,
      },
      recentCourses: [
        {
          id: 'course_1',
          title: 'Frontend Foundations',
          status: 'SUBMITTED',
          moduleCount: 2,
          lessonCount: 3,
          quizCount: 1,
        },
      ],
    });

    renderWithRouter(<CreatorDashboard />);

    expect(await screen.findByText('Recent course work')).toBeInTheDocument();
    expect(screen.getByText('Frontend Foundations')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('renders lesson editor notes, video state, and quiz state', async () => {
    fetchCreatorLesson.mockResolvedValue({
      lesson: {
        id: 'lesson_1',
        title: 'Create your first page',
        summary: 'Use semantic HTML.',
        videoUrl: 'https://video.example.com/html',
        topicPage: null,
        notes: [
          {
            id: 'note_1',
            type: 'PARAGRAPH',
            content: 'HTML gives pages structure.',
          },
        ],
        quiz: {
          id: 'quiz_1',
          title: 'HTML checkpoint',
          instructions: '',
          questions: [
            {
              prompt: 'Which tag creates a heading?',
              type: 'MULTIPLE_CHOICE',
              options: ['h1', 'p'],
              correctAnswer: 'h1',
              explanation: '',
            },
          ],
        },
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/creator/lessons/:lessonId" element={<LessonEditor />} />
      </Routes>,
      ['/creator/lessons/lesson_1']
    );

    expect(
      await screen.findAllByText('Create your first page')
    ).not.toHaveLength(0);
    expect(screen.getByText('HTML gives pages structure.')).toBeInTheDocument();
    expect(screen.getByText(/Video URL saved/)).toBeInTheDocument();
    expect(screen.getByText(/Quiz ready/)).toBeInTheDocument();
  });
});
