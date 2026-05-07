// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RoadmapNodeCard from './RoadmapNodeCard';

function renderCard(status) {
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <RoadmapNodeCard
        roadmapId="roadmap_1"
        node={{
          id: 'node_1',
          title: 'HTML basics',
          summary: 'Learn semantic HTML',
          order: 0,
          prerequisites: [],
          progress: { status },
        }}
      />
    </MemoryRouter>
  );
}

describe('RoadmapNodeCard', () => {
  it.each([
    ['NOT_STARTED', 'Not started'],
    ['IN_PROGRESS', 'In progress'],
    ['COMPLETED', 'Completed'],
    ['NEEDS_REVISION', 'Needs revision'],
  ])('renders %s as %s', (status, label) => {
    renderCard(status);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
