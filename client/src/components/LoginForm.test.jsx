import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import renderWithProviders from '../test/renderWithProviders.jsx';
import LoginForm from './LoginForm.jsx';
import * as authApi from '../api/auth.js';

vi.mock('../api/auth.js');

const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

// This helper is used to simulate entering text in the form fields
// and pressing the login button. userEvent (as opposed to fireEvent)
// is chosen because it dispatches the entire lifecycle sequence of
// events that a real browser would fire when a human interacts
// with the page
async function fillAndSubmit(username, password) {
  await userEvent.type(screen.getByLabelText('Username'), username);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('asks for both fields before contacting the server', async () => {
    renderWithProviders(<LoginForm onSuccess={() => { }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('Username is required');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Password is required');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('logs in with what was typed and reports the user', async () => {
    authApi.login.mockResolvedValue({ token: 'new.jwt.token', user: max });
    // We need to mock this because the LoginForm expects it - also gives
    // us access to properties describing how it was used
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await fillAndSubmit('max', 'hunter22!');

    expect(authApi.login).toHaveBeenCalledWith('max', 'hunter22!');
    expect(onSuccess).toHaveBeenCalledWith(max);
  });

  it('shows the server\'s wrong-password message in a banner and stays put', async () => {
    authApi.login.mockRejectedValue(Object.assign(new Error('Request failed with status code 401'), {
      response: { status: 401, data: { error: { code: 'UNAUTHORIZED', message: 'Wrong username or password' } } },
    }));
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await fillAndSubmit('max', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('logs in cleanly without an onSuccess handler, since GuestOnly does the redirect', async () => {
    authApi.login.mockResolvedValue({ token: 'new.jwt.token', user: max });
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('max', 'hunter22!');

    expect(authApi.login).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
