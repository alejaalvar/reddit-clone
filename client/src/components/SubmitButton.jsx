/**
 * The submit button for every form. While isSubmitting (from useForm)
 * is true it shows daisyUI's spinner and is disabled, so a double
 * click can't send the same login or sign up twice.
 *
 * The label stays visible next to the spinner, and the spinner is
 * hidden from screen readers; aria-busy tells them the work is ongoing.
 */
export default function SubmitButton({ isSubmitting = false, children }) {
  return (
    <button
      type="submit"
      className="btn btn-primary w-full"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting && <span className="loading loading-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
