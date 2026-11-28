/**
 * @file Creates and exports a test helper that renders inside the app's providers
 * @module client/src/test/renderWithProviders.jsx
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth.jsx';

/**
 * Renders ui inside the same providers main.jsx uses, with a fresh
 * query cache per test and an in-memory router starting at `route`
 * (a path, or { pathname, state } to simulate a redirect).
 */
export default function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
