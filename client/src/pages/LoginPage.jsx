/**
 * @file Creates and exports LoginPage, the page at /login
 * @module client/src/pages/LoginPage.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { Link } from 'react-router';
import AuthCard from '../components/AuthCard.jsx';
import LoginForm from '../components/LoginForm.jsx';

/**
 * The log in form in an AuthCard, with a link to sign up instead.
 *
 * There is no navigate() here on purpose: once login() marks the person
 * as logged in, GuestOnly (which wraps this route) redirects them, back
 * to the page that sent them here or else home. Navigating here as well
 * would race GuestOnly's redirect.
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      footer={(
        <>
          New here?
          {' '}
          <Link to="/register" className="link link-primary">Sign up</Link>
        </>
      )}
    >
      <LoginForm />
    </AuthCard>
  );
}
