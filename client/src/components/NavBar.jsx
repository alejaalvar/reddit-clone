/**
 * @file Creates and exports the NavBar shown at the top of every page
 * @module client/src/components/NavBar.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * Logo on the left, linking home. On the right: Log in and Sign up for
 * guests, or u/username and Log out for a logged-in user.
 *
 * While a saved token is still being checked the right side stays
 * empty, so a logged-in user never sees "Log in" flash on reload.
 */
export default function NavBar() {
  const { user, status, logout } = useAuth();

  return (
    <nav className="navbar bg-base-100 shadow-sm px-4">
      <div className="navbar-start">
        <Link to="/" className="text-xl font-bold">reddit clone</Link>
      </div>
      <div className="navbar-end gap-2">
        {status === 'authed' && (
          <>
            <span className="font-medium">{`u/${user.username}`}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </>
        )}
        {status === 'guest' && (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
        {/* status 'loading': nothing, on purpose */}
      </div>
    </nav>
  );
}
