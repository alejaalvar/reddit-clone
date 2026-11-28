import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient();

/**
 * We need to wrap the app with our react router to
 * share routing context across the entire component
 * tree. We also wrap it with tanstack so that each
 * component can share a single, centralized cache.
 * AuthProvider shares who is logged in; it sits inside
 * QueryClientProvider because logout() clears that cache.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
