import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Holds who is logged in and shares it with the whole app through
 * context, so any component can call useAuth() instead of passing the
 * user down through props.
 *
 * status is 'loading' while a saved token is being checked with
 * GET /api/auth/me, then 'authed' or 'guest'. Without a saved token it
 * starts as 'guest', so nothing waits on a request that won't happen.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'));

  // On page load, turn a saved token back into a user
  useEffect(() => {
    if (!tokenStore.get()) return undefined;

    // StrictMode runs effects twice in development; ignore the
    // answer from the first, discarded run
    let ignore = false;
    authApi.getMe()
      .then((data) => {
        if (ignore) return;
        setUser(data.user);
        setStatus('authed');
      })
      .catch(() => {
        if (ignore) return;
        // Expired, invalid, or the account is gone
        tokenStore.clear();
        setStatus('guest');
      });
    return () => { ignore = true; };
  }, []);

  // Login and register both answer { token, user }. setUser and
  // setStatus never change, so this callback is created only once.
  const startSession = useCallback(({ token, user: loggedIn }) => {
    tokenStore.set(token);
    setUser(loggedIn);
    setStatus('authed');
    return loggedIn;
  }, []);

  // Errors are not caught here: they reach useForm, which shows them
  const login = useCallback(
    async (username, password) => startSession(await authApi.login(username, password)),
    [startSession],
  );

  const register = useCallback(
    async (username, email, password) => startSession(
      await authApi.register(username, email, password),
    ),
    [startSession],
  );

  // There is no logout route; forgetting the token is enough. Clearing
  // the cache keeps this user's myVote values from showing for the next.
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  // A new object on every render would re-render every useAuth() caller,
  // so the value only changes when the user or status does
  const value = useMemo(() => ({
    user, status, login, register, logout,
  }), [user, status, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
