/**
 * @file Creates and exports SignupPage, the page at /register
 * @module client/src/pages/SignupPage.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { Link } from 'react-router';
import AuthCard from '../components/AuthCard.jsx';
import SignupForm from '../components/SignupForm.jsx';

/**
 * The sign up form in an AuthCard, with a link to log in instead.
 *
 * Register returns a token, so a successful sign up logs the person in
 * and GuestOnly (which wraps this route) sends them on, the same way
 * as after logging in. That's why there is no navigate() here.
 */
export default function SignupPage() {
  return (
    <AuthCard
      title="Sign up"
      footer={(
        <>
          Already have an account?
          {' '}
          <Link to="/login" className="link link-primary">Log in</Link>
        </>
      )}
    >
      <SignupForm />
    </AuthCard>
  );
}
