/**
 * @file Creates and exports TextField, the labelled input used by every form
 * @module client/src/components/TextField.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { useId } from 'react';

/**
 * A labelled input for every form: label, input, then one line under it
 * that shows the error when there is one and the hint otherwise.
 *
 * error comes straight from useForm's errors[name]. It turns the input
 * red and sets aria-invalid, and the note is linked with
 * aria-describedby so screen readers read it with the field.
 * action is an optional control shown joined to the right of the
 * input, such as PasswordField's Show button.
 * Any other prop (type, autoComplete, ...) goes onto the <input>.
 */
export default function TextField({
  label, name, value, onChange, hint, error, action, type = 'text', ...inputProps
}) {
  const id = useId(); // unique per field, so two forms on a page can't clash
  const noteId = `${id}-note`;
  const note = error || hint;

  const input = (
    <input
      // Pass-through is the point of a shared field component
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...inputProps}
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      aria-invalid={error ? true : undefined}
      aria-describedby={note ? noteId : undefined}
      className={`input w-full ${action ? 'join-item' : ''} ${error ? 'input-error' : ''}`}
    />
  );

  return (
    <fieldset className="fieldset">
      <label htmlFor={id} className="fieldset-legend">{label}</label>
      {action ? (
        <div className="join w-full">
          {input}
          {action}
        </div>
      ) : input}
      {note && <p id={noteId} className={`label ${error ? 'text-error' : ''}`}>{note}</p>}
    </fieldset>
  );
}
