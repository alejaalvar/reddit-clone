/**
 * @file Creates and exports GuestOnly, a layout route for guest-only pages
 * @module client/src/components/GuestOnly.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * A layout route for pages only guests should see (log in, sign up).
 * A logged-in user is sent on: to state.from when a protected page
 * redirected them here (RequireAuth sets it), otherwise home. This is
 * also what moves people on right after they log in or sign up, so the
 * pages themselves don't navigate. replace keeps /login out of the
 * history, so Back doesn't bounce them here again.
 *
 * While a saved token is still being checked, nothing renders: the
 * person may turn out to be logged in, and the form shouldn't flash.
 */
export default function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return null;
  if (status === 'authed') return <Navigate to={location.state?.from ?? '/'} replace />;
  return <Outlet />;
}
