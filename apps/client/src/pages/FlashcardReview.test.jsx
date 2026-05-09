// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FlashcardReview from './FlashcardReview';
import { fetchFlashcardsDue } from '../features/flashcards/flashcardsApi';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'access-token' },
  }),
}));

vi.mock('../features/flashcards/flashcardsApi', () => ({
  fetchFlashcardsDue: vi.fn(),
  reviewFlashcard: vi.fn(),
}));

describe('FlashcardReview', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    fetchFlashcardsDue.mockResolvedValue({
      flashcards: [
        {
          id: 'flashcard_1',
          frontText: 'What is a heading tag?',
          backText: '<h1>Heading</h1>',
          masteryScore: 60,
          nextReviewAt: '2026-05-07T09:00:00.000Z',
        },
      ],
    });
  });

  it('renders flashcards due for review', async () => {
    render(
      <MemoryRouter>
        <FlashcardReview />
      </MemoryRouter>
    );

    expect(await screen.findByText('Flashcard review')).toBeInTheDocument();
    expect(screen.getByText('What is a heading tag?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show answer/i })).toBeInTheDocument();
  });
});
