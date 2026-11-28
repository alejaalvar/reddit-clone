import { useState } from 'react';
import TextField from './TextField.jsx';

/**
 * A TextField for passwords, with a Show/Hide button so people can check
 * what they typed. Takes the same props as TextField.
 *
 * The button's accessible name includes the field's label ("Show
 * password", "Show confirm password"), so a screen reader can tell the
 * two toggles on the sign up form apart.
 */
export default function PasswordField({ label, ...fieldProps }) {
  const [visible, setVisible] = useState(false);
  const verb = visible ? 'Hide' : 'Show';

  const toggle = (
    <button
      // type="button": a plain <button> inside a <form> would submit it
      type="button"
      className="btn join-item"
      onClick={() => setVisible((v) => !v)}
      aria-label={`${verb} ${label.toLowerCase()}`}
    >
      {verb}
    </button>
  );

  return (
    <TextField
      // Everything else (name, value, error, hint, autoComplete...) is TextField's job
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...fieldProps}
      label={label}
      type={visible ? 'text' : 'password'}
      action={toggle}
    />
  );
}
