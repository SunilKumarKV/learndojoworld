// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DoubtSection from './DoubtSection';
import {
  createDoubt,
  createDoubtReply,
  fetchDoubts,
} from '../../features/doubts/doubtApi';

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'access-token' },
    user: {
      id: 'learner_1',
      email: 'learner@example.com',
      role: 'LEARNER',
    },
  }),
}));

vi.mock('../../features/doubts/doubtApi', () => ({
  acceptDoubtAnswer: vi.fn(),
  createDoubt: vi.fn(),
  createDoubtReply: vi.fn(),
  fetchDoubts: vi.fn(),
  markOfficialAnswer: vi.fn(),
  reportDoubt: vi.fn(),
  reportDoubtReply: vi.fn(),
  upvoteDoubt: vi.fn(),
  upvoteDoubtReply: vi.fn(),
}));

const topic = {
  id: 'topic_1',
  title: 'Semantic HTML',
  roadmapNode: {
    id: 'node_1',
    title: 'HTML basics',
  },
};

const doubts = [
  {
    id: 'doubt_1',
    title: 'Why use semantic HTML?',
    content: 'I do not understand when section is better than div.',
    status: 'RESOLVED',
    videoTimestampSeconds: 95,
    author: {
      id: 'learner_1',
      email: 'learner@example.com',
    },
    upvoteCount: 2,
    hasUpvoted: false,
    replies: [
      {
        id: 'reply_1',
        content: 'Use section when the content has its own heading.',
        author: {
          id: 'creator_1',
          name: 'Creator User',
        },
        isOfficial: true,
        isAccepted: true,
        upvoteCount: 4,
        hasUpvoted: true,
      },
    ],
  },
];

function renderSection() {
  return render(<DoubtSection topic={topic} />);
}

describe('DoubtSection', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchDoubts.mockResolvedValue({ doubts });
    createDoubt.mockResolvedValue({ doubt: doubts[0] });
    createDoubtReply.mockResolvedValue({ reply: doubts[0].replies[0] });
  });

  it('renders doubts, replies, and answer badges', async () => {
    renderSection();

    expect(
      await screen.findByText('Why use semantic HTML?')
    ).toBeInTheDocument();
    expect(screen.getByText('Official answer')).toBeInTheDocument();
    expect(screen.getByText('Accepted answer')).toBeInTheDocument();
    expect(screen.getByText('1:35')).toBeInTheDocument();
    expect(screen.getByText('4 upvotes')).toBeInTheDocument();
  });

  it('opens the ask modal and creates a doubt', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(await screen.findByRole('button', { name: /ask doubt/i }));
    await user.type(
      screen.getByLabelText(/doubt title/i),
      'What is a section?'
    );
    await user.type(
      screen.getByLabelText(/details/i),
      'I need help understanding semantic section elements.'
    );
    await user.type(screen.getByLabelText(/video timestamp seconds/i), '120');
    await user.click(screen.getByRole('button', { name: /post doubt/i }));

    await waitFor(() => {
      expect(createDoubt).toHaveBeenCalledWith('access-token', {
        title: 'What is a section?',
        content: 'I need help understanding semantic section elements.',
        topicPageId: 'topic_1',
        roadmapNodeId: 'node_1',
        videoTimestampSeconds: 120,
      });
    });
    expect(fetchDoubts).toHaveBeenCalledTimes(2);
  });

  it('posts a reply to a doubt', async () => {
    const user = userEvent.setup();
    renderSection();

    await screen.findByText('Why use semantic HTML?');
    await user.type(
      screen.getByPlaceholderText(/reply to this doubt/i),
      'This explanation helped me.'
    );
    await user.click(screen.getByRole('button', { name: /^reply$/i }));

    await waitFor(() => {
      expect(createDoubtReply).toHaveBeenCalledWith('access-token', 'doubt_1', {
        content: 'This explanation helped me.',
      });
    });
  });
});
