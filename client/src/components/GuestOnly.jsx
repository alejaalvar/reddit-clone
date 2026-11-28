// file: GuestOnly.jsx

import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * A layout route for pages only guests should see (log in, sign up).
 * A logged-in user is sent to the home page instead; replace keeps
 * /login out of the history, so Back doesn't bounce them here again.
 *
 * While a saved token is still being checked, nothing renders: the
 * person may turn out to be logged in, and the form shouldn't flash.
 */
export default function GuestOnly() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}
