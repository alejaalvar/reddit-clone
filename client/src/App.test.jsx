/**
 * @file Tests the app's routes: guest-only pages and the nav bar
 * @module client/src/App.test.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  describe('nav bar', () => {
    const nav = () => within(screen.getByRole('navigation'));

    it('offers a guest links to log in and sign up', async () => {
      renderWithProviders(<App />, { route: '/' });

      expect(nav().getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
      expect(nav().getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    });

    it('shows a logged-in user their name and a log out button instead', async () => {
      logInAsMax();
      renderWithProviders(<App />, { route: '/' });

      expect(await nav().findByText('u/max')).toBeInTheDocument();
      expect(nav().getByRole('button', { name: 'Log out' })).toBeInTheDocument();
      expect(nav().queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
      expect(nav().queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument();
    });

    it('logs out: the guest links come back and the saved token is gone', async () => {
      logInAsMax();
      renderWithProviders(<App />, { route: '/' });

      await userEvent.click(await nav().findByRole('button', { name: 'Log out' }));

      expect(nav().getByRole('link', { name: 'Log in' })).toBeInTheDocument();
      expect(nav().queryByText('u/max')).not.toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('shows neither until a saved token has been checked, so "Log in" doesn\'t flash', () => {
      localStorage.setItem('token', 'saved.jwt.token');
      authApi.getMe.mockReturnValue(new Promise(() => {})); // never answers

      renderWithProviders(<App />, { route: '/' });

      expect(nav().queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
      expect(nav().queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    });

    it('has a logo that links to the home page', () => {
      renderWithProviders(<App />, { route: '/register' });

      expect(nav().getByRole('link', { name: 'reddit clone' })).toHaveAttribute('href', '/');
    });
  });
});
