import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen } from '@testing-library/react';
import renderWithProviders from './test/renderWithProviders.jsx';
import App from './App.jsx';
import * as authApi from './api/auth.js';

vi.mock('./api/auth.js');

const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

// A saved token that /auth/me accepts: the person is logged in on load
function logInAsMax() {
  localStorage.setItem('token', 'saved.jwt.token');
  authApi.getMe.mockResolvedValue({ user: max });
}

describe('App routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('guest-only pages', () => {
    it.each(['/login', '/register'])('send a logged-in user from %s to the home page', async (route) => {
      logInAsMax();

      renderWithProviders(<App />, { route });

      expect(await screen.findByRole('heading', { name: 'Reddit clone' })).toBeInTheDocument();
    });

    it('show the page to a guest', async () => {
      renderWithProviders(<App />, { route: '/login' });

      expect(await screen.findByRole('heading', { name: /log ?in/i })).toBeInTheDocument();
    });

    it("show nothing while a saved token is still being checked, so the form doesn't flash", () => {
      localStorage.setItem('token', 'saved.jwt.token');
      authApi.getMe.mockReturnValue(new Promise(() => {})); // never answers

      renderWithProviders(<App />, { route: '/login' });

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });
});
