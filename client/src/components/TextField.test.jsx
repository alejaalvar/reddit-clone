/**
 * @file Tests the TextField component
 * @module client/src/components/TextField.test.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextField from './TextField.jsx';

describe('TextField', () => {
  it('is found by its label and reports typing under its name', async () => {
    const names = [];
    const onChange = vi.fn((e) => names.push(e.target.name));
    render(<TextField label="Username" name="username" value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Username'), 'm');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(names).toEqual(['username']);
  });

  it('shows a hint that is announced with the input', () => {
    render(
      <TextField
        label="Username"
        name="username"
        value=""
        onChange={() => {}}
        hint="3 to 20 characters: lowercase letters, numbers and _"
      />,
    );

    expect(screen.getByLabelText('Username'))
      .toHaveAccessibleDescription('3 to 20 characters: lowercase letters, numbers and _');
  });

  it('marks the input invalid and announces the error instead of the hint', () => {
    render(
      <TextField
        label="Username"
        name="username"
        value="max"
        onChange={() => {}}
        hint="3 to 20 characters: lowercase letters, numbers and _"
        error="already taken"
      />,
    );
    const input = screen.getByLabelText('Username');

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('already taken');
    expect(screen.queryByText(/3 to 20 characters/)).not.toBeInTheDocument();
  });

  it('is valid when there is no error', () => {
    render(<TextField label="Username" name="username" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Username')).toBeValid();
  });

  it('passes other input attributes through, such as type and autoComplete', () => {
    render(
      <TextField label="Email" name="email" type="email" autoComplete="email" value="" onChange={() => {}} />,
    );
    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });
});
