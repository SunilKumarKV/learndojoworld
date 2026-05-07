// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import { useAuth } from '../../features/auth/AuthContext';

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRoutes(routeElement) {
  return render(
    <MemoryRouter
      initialEntries={['/private']}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/unauthorized" element={<p>Unauthorized page</p>} />
        <Route element={routeElement}>
          <Route path="/private" element={<p>Private content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('auth route guards', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while auth is restoring', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    renderWithRoutes(<ProtectedRoute />);

    expect(
      screen.getByRole('status', { name: /loading session/i })
    ).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithRoutes(<ProtectedRoute />);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'LEARNER' },
    });

    renderWithRoutes(<ProtectedRoute />);

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('redirects authenticated users without an allowed role', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'LEARNER' },
    });

    renderWithRoutes(<RoleBasedRoute allowedRoles={['ADMIN']} />);

    expect(screen.getByText('Unauthorized page')).toBeInTheDocument();
  });

  it('renders role-protected content for an allowed role', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'ADMIN' },
    });

    renderWithRoutes(<RoleBasedRoute allowedRoles={['ADMIN']} />);

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });
});
