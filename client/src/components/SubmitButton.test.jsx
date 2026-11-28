import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmitButton from './SubmitButton.jsx';

describe('SubmitButton', () => {
  it('submits the form it is in', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SubmitButton>Log in</SubmitButton>
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('is disabled and marked busy while submitting, so it cannot be clicked twice', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SubmitButton isSubmitting>Log in</SubmitButton>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Log in' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
