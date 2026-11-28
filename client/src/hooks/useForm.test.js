/**
 * @file Tests the useForm hook
 * @module client/src/hooks/useForm.test.js
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useForm from './useForm.js';

// A change event as an <input name="..."> would send it
const change = (name, value) => ({ target: { name, value } });
// A submit event; useForm must stop the browser's page reload
// vi.fn() is necessary because React expects the handler to call
// event.preventDefault() to stop default navigation/page reload
// it returns a no-op function since there is no real DOM event,
// so we can pass it around. it also tracks usage as properties
const submitEvent = () => ({ preventDefault: vi.fn() });
// How Axios rejects when the API answers with { error: { ... } }
const apiError = (error) => Object.assign(new Error('Request failed'), {
  response: { data: { error } },
});

describe('useForm', () => {
  it('updates a value when its field changes', () => {
    // we need renderHook because hooks can only be called inside a
    // component, so it builds a throwaway component just to host
    // the hook - returns a small API
    const { result } = renderHook(() => useForm({
      initialValues: { username: '' },
      onSubmit: () => {},
    }));

    // .act() is necessary to force a flush (re-renders components, updates the DOM)
    act(() => result.current.handleChange(change('username', 'max')));

    expect(result.current.values).toEqual({ username: 'max' });
  });

  // we need async here because handleSubmit is async inside the hook
  it('shows validation errors and skips onSubmit when validate finds problems', async () => {
    // a mock function so we can assert it was *not* called and pass it to useForm
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm({
      initialValues: { username: '' },
      validate: () => ({ username: 'Username is required' }),
      onSubmit,
    }));

    // handleSubmit is async, so we need to await the result
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.errors).toEqual({ username: 'Username is required' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the current values when validation passes', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useForm({
      initialValues: { username: 'max', password: 'hunter22!' },
      validate: () => ({}),
      onSubmit,
    }));

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'max',
      password: 'hunter22!',
    });
  });

  it('copies the API error fields into errors and its message into formError', async () => {
    const { result } = renderHook(() => useForm({
      initialValues: { username: 'max' },
      onSubmit: () => Promise.reject(
        apiError({
          code: 'DUPLICATE',
          message: 'That username is already taken',
          fields: { username: 'already taken' },
        }),
      ),
    }));

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.errors).toEqual({ username: 'already taken' });
    expect(result.current.formError).toBe('That username is already taken');
  });

  it('shows a generic formError when the request fails without an API response', async () => {
    const { result } = renderHook(() => useForm({
      initialValues: { username: 'max' },
      onSubmit: () => Promise.reject(new Error('Network Error')),
    }));

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.formError).toBe('Something went wrong. Try again.');
  });

  it('is submitting only while onSubmit is pending', async () => {
    let finish;
    const { result } = renderHook(() => useForm({
      initialValues: { username: 'max' },
      onSubmit: () => new Promise((resolve) => {
        finish = resolve;
      }),
    }));
    expect(result.current.isSubmitting).toBe(false);

    let submitting;
    act(() => {
      submitting = result.current.handleSubmit(submitEvent());
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      finish();
      await submitting;
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('clears a field error once that field is edited', async () => {
    const { result } = renderHook(() => useForm({
      initialValues: { username: '', password: '' },
      validate: () => ({
        username: 'Username is required',
        password: 'Password is required',
      }),
      onSubmit: () => {},
    }));
    await act(() => result.current.handleSubmit(submitEvent()));

    act(() => result.current.handleChange(change('username', 'max')));

    expect(result.current.errors).toEqual({ password: 'Password is required' });
  });

  it('clears the previous formError when the form is submitted again', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(
        apiError({
          code: 'UNAUTHORIZED',
          message: 'Wrong username or password',
        }),
      )
      .mockResolvedValueOnce();
    const { result } = renderHook(() => useForm({
      initialValues: { username: 'max', password: 'hunter22!' },
      onSubmit,
    }));
    await act(() => result.current.handleSubmit(submitEvent()));
    expect(result.current.formError).toBe('Wrong username or password');

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.formError).toBeNull();
  });
});
