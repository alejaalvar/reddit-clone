/**
 * @file Tests the sign up page through the app's routes
 * @module client/src/pages/SignupPage.test.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import renderWithProviders from '../test/renderWithProviders.jsx';
import App from '../App.jsx';
import * as authApi from '../api/auth.js';

vi.mock('../api/auth.js');

const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

describe('SignupPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a titled sign up form with a link to log in instead', async () => {
    renderWithProviders(<App />, { route: '/register' });
    const page = within(screen.getByRole('main'));

    expect(await page.findByRole('heading', { name: 'Sign up' })).toBeInTheDocument();
    expect(page.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(page.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(page.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('logs the new user in and takes them home, since register returns a token', async () => {
    authApi.register.mockResolvedValue({ token: 'new.jwt.token', user: max });
    renderWithProviders(<App />, { route: '/register' });

    await userEvent.type(await screen.findByLabelText('Username'), 'max');
    await userEvent.type(screen.getByLabelText('Email'), 'max@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'hunter22!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'hunter22!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('heading', { name: 'Reddit clone' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByText('u/max')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('new.jwt.token');
  });
});
