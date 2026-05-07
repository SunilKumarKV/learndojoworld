// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import Register from './Register';

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

function renderPage(page) {
  return render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      {page}
    </MemoryRouter>
  );
}

describe('auth pages', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form fields and action', () => {
    renderPage(<Login />);

    expect(
      screen.getByRole('heading', { name: /log in to your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders register form without admin self-registration', () => {
    renderPage(<Register />);

    expect(
      screen.getByRole('heading', { name: /create your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /learner/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /creator/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /admin/i })
    ).not.toBeInTheDocument();
  });
});
