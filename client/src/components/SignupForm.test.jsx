/**
 * @file Tests the SignupForm component
 * @module client/src/components/SignupForm.test.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import renderWithProviders from '../test/renderWithProviders.jsx';
import SignupForm from './SignupForm.jsx';
import * as authApi from '../api/auth.js';

vi.mock('../api/auth.js');

const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

const valid = {
  username: 'max', email: 'max@example.com', password: 'hunter22!', confirm: 'hunter22!',
};

// Types each given field (empty strings are skipped) and submits
async function fillAndSubmit(fields) {
  const {
    username, email, password, confirm,
  } = { ...valid, ...fields };
  if (username) await userEvent.type(screen.getByLabelText('Username'), username);
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
  if (confirm) await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('registers with username, email and password (not the confirmation) and reports the user', async () => {
    authApi.register.mockResolvedValue({ token: 'new.jwt.token', user: max });
    const onSuccess = vi.fn();
    renderWithProviders(<SignupForm onSuccess={onSuccess} />);

    await fillAndSubmit(valid);

    expect(authApi.register).toHaveBeenCalledWith('max', 'max@example.com', 'hunter22!');
    expect(onSuccess).toHaveBeenCalledWith(max);
  });

  it.each([
    ['', 'Username is required'],
    ['ab', 'Username must be 3 to 20 characters'],
    ['a'.repeat(21), 'Username must be 3 to 20 characters'],
    ['max!', 'Username can only use letters, numbers and _'],
    ['max power', 'Username can only use letters, numbers and _'],
  ])('rejects the username "%s" with "%s" before contacting the server', async (username, message) => {
    renderWithProviders(<SignupForm onSuccess={() => {}} />);

    await fillAndSubmit({ username });

    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(message);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('accepts capital letters, since the server stores usernames lowercase', async () => {
    authApi.register.mockResolvedValue({ token: 'new.jwt.token', user: max });
    renderWithProviders(<SignupForm onSuccess={() => {}} />);

    await fillAndSubmit({ username: 'Max_99' });

    expect(authApi.register).toHaveBeenCalledWith('Max_99', 'max@example.com', 'hunter22!');
  });

  it.each([
    ['', 'Email is required'],
    ['max', 'Enter a valid email address'],
    ['max@example', 'Enter a valid email address'],
  ])('rejects the email "%s" with "%s"', async (email, message) => {
    renderWithProviders(<SignupForm onSuccess={() => {}} />);

    await fillAndSubmit({ email });

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(message);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'Password is required'],
    ['short1!', 'Password must be at least 8 characters'],
    ['a'.repeat(73), 'Password must be at most 72 bytes'],
    // 40 characters, but é takes 2 bytes, so 80 bytes
    ['é'.repeat(40), 'Password must be at most 72 bytes'],
  ])('rejects the password "%s" with "%s"', async (password, message) => {
    renderWithProviders(<SignupForm onSuccess={() => {}} />);

    await fillAndSubmit({ password, confirm: password });

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(message);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'Confirm your password'],
    ['hunter23!', 'Passwords don\'t match'],
  ])('rejects the confirmation "%s" with "%s"', async (confirm, message) => {
    renderWithProviders(<SignupForm onSuccess={() => {}} />);

    await fillAndSubmit({ password: 'hunter22!', confirm });

    expect(screen.getByLabelText('Confirm password')).toHaveAccessibleDescription(message);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('shows a taken username next to the field and in the banner', async () => {
    authApi.register.mockRejectedValue(Object.assign(new Error('Request failed with status code 409'), {
      response: {
        status: 409,
        data: { error: { code: 'DUPLICATE', message: 'That username is already taken', fields: { username: 'already taken' } } },
      },
    }));
    const onSuccess = vi.fn();
    renderWithProviders(<SignupForm onSuccess={onSuccess} />);

    await fillAndSubmit(valid);

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is already taken');
    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('already taken');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('signs up cleanly without an onSuccess handler, since GuestOnly does the redirect', async () => {
    authApi.register.mockResolvedValue({ token: 'new.jwt.token', user: max });
    renderWithProviders(<SignupForm />);

    await fillAndSubmit(valid);

    expect(authApi.register).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
