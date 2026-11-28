/**
 * @file Tests the log in page through the app's routes
 * @module client/src/pages/LoginPage.test.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import renderWithProviders from '../test/renderWithProviders.jsx';
import App from '../App.jsx';
import GuestOnly from '../components/GuestOnly.jsx';
import LoginPage from './LoginPage.jsx';
import * as authApi from '../api/auth.js';

vi.mock('../api/auth.js');

const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

async function logIn() {
  authApi.login.mockResolvedValue({ token: 'new.jwt.token', user: max });
  await userEvent.type(await screen.findByLabelText('Username'), 'max');
  await userEvent.type(screen.getByLabelText('Password'), 'hunter22!');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a titled log in form with a link to sign up instead', async () => {
    renderWithProviders(<App />, { route: '/login' });

    const page = within(screen.getByRole('main'));

    expect(await page.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(page.getByLabelText('Username')).toBeInTheDocument();
    expect(page.getByText(/new here\?/i)).toBeInTheDocument();
    expect(page.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
  });

  it('takes the person home after logging in, now shown as logged in', async () => {
    renderWithProviders(<App />, { route: '/login' });

    await logIn();

    expect(await screen.findByRole('heading', { name: 'Reddit clone' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByText('u/max')).toBeInTheDocument();
  });

  it('returns the person to the page that sent them to log in', async () => {
    // RequireAuth (not built yet) will redirect with state: { from: location }
    renderWithProviders(
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/r/webdev/submit" element={<h1>Create post in r/webdev</h1>} />
      </Routes>,
      { route: { pathname: '/login', state: { from: { pathname: '/r/webdev/submit' } } } },
    );

    await logIn();

    expect(await screen.findByRole('heading', { name: 'Create post in r/webdev' })).toBeInTheDocument();
  });
});
