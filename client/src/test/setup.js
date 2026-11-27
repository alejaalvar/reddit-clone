// Runs before every test file (see `test.setupFiles` in vite.config.js).
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  // Unmount whatever the test rendered and forget any saved token,
  // so no test can leak state into the next one.
  cleanup();
  localStorage.clear();
});
