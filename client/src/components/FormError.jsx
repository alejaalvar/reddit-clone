/**
 * The banner at the top of a form for errors that belong to no single
 * field, such as "Wrong username or password". message is useForm's
 * formError; with no message nothing is rendered.
 *
 * role="alert" makes screen readers read the message out as soon as it
 * appears, since the person's focus is still on the submit button.
 */
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <span>{message}</span>
    </div>
  );
}
