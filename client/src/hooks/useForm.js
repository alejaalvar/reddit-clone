// file: useForm.js

import { useState } from 'react';

const FALLBACK_ERROR = 'Something went wrong. Try again.';

/**
 * Form state for every form in the app. It holds the values, runs the
 * browser-side checks, and turns an API error into messages:
 * error.fields go next to their inputs (errors) and error.message goes
 * in the banner (formError).
 *
 * validate(values) returns { field: message } for each problem, or {}.
 * onSubmit(values) may return a promise; while it is pending,
 * isSubmitting is true so the submit button can disable itself.
 */
export default function useForm({
  initialValues,
  validate = () => ({}),
  onSubmit,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // The user is fixing this field, so its old message no longer applies
    setErrors(({ [name]: _cleared, ...rest }) => rest);
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's full-page form post
    setFormError(null);

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      // The API answers with { error: { code, message, fields? } };
      // a network failure has no response at all. We use the optional
      // chaining operator to safely access properties of an object that
      // might be null or undefined without throwing a TypeError
      const apiError = err.response?.data?.error;
      // we use nullish coalescing operator and not || because
      // null or undefined are *intentional* values
      setErrors(apiError?.fields ?? {});
      setFormError(apiError?.message ?? FALLBACK_ERROR);
    } finally {
      // re-enable the button whether or not it threw
      setIsSubmitting(false);
    }
  }

  return {
    values,
    errors,
    formError,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}
