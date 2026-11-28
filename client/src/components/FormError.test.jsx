import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormError from './FormError.jsx';

describe('FormError', () => {
  it('announces the message as an alert', () => {
    render(<FormError message="Wrong username or password" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Wrong username or password');
  });

  it('renders nothing when there is no message', () => {
    const { container } = render(<FormError message={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
