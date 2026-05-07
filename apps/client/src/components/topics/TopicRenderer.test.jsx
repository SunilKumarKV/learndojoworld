// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TopicRenderer from './TopicRenderer';

const topic = {
  blocks: [
    {
      id: 'block_1',
      type: 'PARAGRAPH',
      content: 'HTML gives pages structure.',
    },
    {
      id: 'block_2',
      type: 'REAL_WORLD_EXAMPLE',
      title: 'Recipe page',
      content: 'A recipe page uses headings, lists, and links.',
    },
    {
      id: 'block_3',
      type: 'COMMON_MISTAKE',
      title: 'Skipping semantics',
      content: 'Using divs for everything makes pages harder to understand.',
    },
    {
      id: 'block_4',
      type: 'CODE',
      language: 'html',
      content: '<h1>Hello</h1>',
    },
    {
      id: 'block_5',
      type: 'QUIZ_REFERENCE',
      content: 'Mini quiz: identify the heading element.',
    },
  ],
};

describe('TopicRenderer', () => {
  it('renders W3Schools-style topic sections', () => {
    render(<TopicRenderer topic={topic} />);

    expect(screen.getByText('Explanation')).toBeInTheDocument();
    expect(screen.getByText('Real-world examples')).toBeInTheDocument();
    expect(screen.getByText('Common mistakes')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Mini quiz')).toBeInTheDocument();
    expect(screen.getByText('HTML gives pages structure.')).toBeInTheDocument();
    expect(screen.getByText('<h1>Hello</h1>')).toBeInTheDocument();
  });
});
