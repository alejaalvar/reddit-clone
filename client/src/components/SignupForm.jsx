/**
 * @file Creates the SignupForm using the form kit
 * @module client/src/components/SignupForm.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { useAuth } from '../hooks/useAuth.jsx';
import useForm from '../hooks/useForm.js';
import FormError from './FormError.jsx';
import TextField from './TextField.jsx';
import PasswordField from './PasswordField.jsx';
import SubmitButton from './SubmitButton.jsx';

// The same rules the API enforces (models/User.js and the register
// controller), checked here first so people get friendly messages
// instead of Mongoose's wording, and see every problem at once.
const USERNAME_PATTERN = /^[a-z0-9_]+$/i; // i: the server lowercases usernames
const EMAIL_PATTERN = /.+@.+\..+/;
const PASSWORD_MIN_CHARS = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything past 72 bytes

function validate({
  username, email, password, confirm,
}) {
  const errors = {};

  if (!username) errors.username = 'Username is required';
  else if (username.length < 3 || username.length > 20) errors.username = 'Username must be 3 to 20 characters';
  else if (!USERNAME_PATTERN.test(username)) errors.username = 'Username can only use letters, numbers and _';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';

  // Count characters as code points (an emoji is one), but the maximum
  // in bytes, since an accented letter or emoji takes 2 to 4
  if (!password) errors.password = 'Password is required';
  else if ([...password].length < PASSWORD_MIN_CHARS) errors.password = `Password must be at least ${PASSWORD_MIN_CHARS} characters`;
  else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) errors.password = `Password must be at most ${PASSWORD_MAX_BYTES} bytes`;

  if (!confirm) errors.confirm = 'Confirm your password';
  else if (confirm !== password) errors.confirm = "Passwords don't match";

  return errors;
}

/**
 * Username, email, password and a confirmation, sent to
 * useAuth().register. Register answers with a token, so success means
 * the person is already logged in and GuestOnly moves them on;
 * onSuccess(user) is an optional extra hook.
 *
 * The confirmation is checked here only; the API doesn't take it.
 * A taken username or email comes back as a 409, which useForm shows
 * under the field and in the banner.
 */
export default function SignupForm({ onSuccess }) {
  const { register } = useAuth();
  const {
    values, errors, formError, isSubmitting, handleChange, handleSubmit,
  } = useForm({
    initialValues: {
      username: '', email: '', password: '', confirm: '',
    },
    validate,
    onSubmit: async ({ username, email, password }) => {
      const user = await register(username, email, password);
      onSuccess?.(user);
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <FormError message={formError} />
      <TextField
        label="Username"
        name="username"
        autoComplete="username"
        hint="3 to 20 characters: letters, numbers and _"
        value={values.username}
        onChange={handleChange}
        error={errors.username}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN_CHARS} characters`}
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <PasswordField
        label="Confirm password"
        name="confirm"
        autoComplete="new-password"
        value={values.confirm}
        onChange={handleChange}
        error={errors.confirm}
      />
      <SubmitButton isSubmitting={isSubmitting}>Sign up</SubmitButton>
    </form>
  );
}
