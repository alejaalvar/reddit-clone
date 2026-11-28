import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './useAuth.jsx';
import * as authApi from '../api/auth.js';

// The API module is the system boundary: no real HTTP in these tests
vi.mock('../api/auth.js');

// The User shape from the spec's auth responses
const max = {
  _id: '6741f2c9a8b3e1d2f4c5a6b7', username: 'max', email: 'max@example.com', createdAt: '2026-11-20T10:00:00.000Z',
};

// Every render gets a fresh cache, the way main.jsx sets up the app
function renderAuth() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return { ...renderHook(() => useAuth(), { wrapper }), queryClient };
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks(); // undo console spies
  });

  it('is a guest right away when no token is saved', () => {
    const { result } = renderAuth();

    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
  });

  it('restores the user from /auth/me when a token is saved', async () => {
    localStorage.setItem('token', 'saved.jwt.token');
    authApi.getMe.mockResolvedValue({ user: max });

    const { result } = renderAuth();
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('authed'));
    expect(result.current.user).toEqual(max);
  });

  it('drops a saved token that /auth/me rejects and becomes a guest', async () => {
    localStorage.setItem('token', 'expired.jwt.token');
    authApi.getMe.mockRejectedValue(new Error('Request failed with status code 401'));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logs in: saves the token and becomes authed with the returned user', async () => {
    authApi.login.mockResolvedValue({ token: 'new.jwt.token', user: max });
    const { result } = renderAuth();

    await act(() => result.current.login('max', 'hunter22!'));

    expect(authApi.login).toHaveBeenCalledWith('max', 'hunter22!');
    expect(localStorage.getItem('token')).toBe('new.jwt.token');
    expect(result.current.status).toBe('authed');
    expect(result.current.user).toEqual(max);
  });

  it('rethrows a failed login so the form can show it, and stays a guest', async () => {
    const wrongPassword = new Error('Request failed with status code 401');
    authApi.login.mockRejectedValue(wrongPassword);
    const { result } = renderAuth();

    await act(() => expect(result.current.login('max', 'wrong')).rejects.toBe(wrongPassword));

    expect(result.current.status).toBe('guest');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('registers and is logged in straight away, since register returns a token', async () => {
    authApi.register.mockResolvedValue({ token: 'new.jwt.token', user: max });
    const { result } = renderAuth();

    await act(() => result.current.register('max', 'max@example.com', 'hunter22!'));

    expect(authApi.register).toHaveBeenCalledWith('max', 'max@example.com', 'hunter22!');
    expect(localStorage.getItem('token')).toBe('new.jwt.token');
    expect(result.current.status).toBe('authed');
    expect(result.current.user).toEqual(max);
  });

  it("logs out: forgets the token and user and empties the query cache so the next user can't see this one's data", async () => {
    localStorage.setItem('token', 'saved.jwt.token');
    authApi.getMe.mockResolvedValue({ user: max });
    const { result, queryClient } = renderAuth();
    await waitFor(() => expect(result.current.status).toBe('authed'));
    queryClient.setQueryData(['posts', null, 'new'], { pages: [{ posts: [{ myVote: 1 }] }] });

    act(() => result.current.logout());

    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(queryClient.getQueryData(['posts', null, 'new'])).toBeUndefined();
  });

  it('explains the mistake when used outside AuthProvider', () => {
    // React logs the thrown error; keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>');
  });
});
