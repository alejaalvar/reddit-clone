// file: LoginForm.jsx

import { useAuth } from '../hooks/useAuth.jsx';
import useForm from '../hooks/useForm.js';
import FormError from './FormError.jsx';
import TextField from './TextField.jsx';
import PasswordField from './PasswordField.jsx';
import SubmitButton from './SubmitButton.jsx';

// Same wording as the API's 400 messages, so both read alike
function validate({ username, password }) {
  const errors = {};
  if (!username) errors.username = 'Username is required';
  if (!password) errors.password = 'Password is required';
  return errors;
}

/**
 * Username and password, sent to useAuth().login. On success GuestOnly
 * moves the person on; onSuccess(user) is an optional extra hook. A wrong
 * username or password comes back from the API as a 401, which useForm
 * shows in the FormError banner.
 *
 * noValidate turns off the browser's own popups, so every message
 * comes from validate() and looks the same.
 */
export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const {
    values, errors, formError, isSubmitting, handleChange, handleSubmit,
  } = useForm({
    initialValues: { username: '', password: '' },
    validate,
    onSubmit: async ({ username, password }) => {
      const user = await login(username, password);
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
        value={values.username}
        onChange={handleChange}
        error={errors.username}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
      />
      <SubmitButton isSubmitting={isSubmitting}>Log in</SubmitButton>
    </form>
  );
}
