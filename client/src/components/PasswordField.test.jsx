import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordField from './PasswordField.jsx';

describe('PasswordField', () => {
  it('hides what is typed by default', () => {
    render(<PasswordField label="Password" name="password" value="hunter22!" onChange={() => {}} />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows and hides the password with a toggle button', async () => {
    render(<PasswordField label="Password" name="password" value="hunter22!" onChange={() => {}} />);
    const input = screen.getByLabelText('Password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not submit the surrounding form when toggled', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordField label="Password" name="password" value="hunter22!" onChange={() => {}} />
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes hint, error and input attributes through to the field', () => {
    render(
      <PasswordField
        label="Password"
        name="password"
        value="short"
        onChange={() => {}}
        hint="At least 8 characters"
        error="Password must be at least 8 characters"
        autoComplete="new-password"
      />,
    );
    const input = screen.getByLabelText('Password');

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Password must be at least 8 characters');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });
});
