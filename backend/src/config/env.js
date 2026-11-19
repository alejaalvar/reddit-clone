// Loads .env and fails fast if a required variable is missing, so a bad
// setup stops at startup with a clear message instead of failing on the
// first request. Import this before anything that reads process.env.
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const REQUIRED = ['MONGODB_URI', 'DB_NAME', 'JWT_SECRET'];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. `
      + 'Copy backend/.env.example to backend/.env and fill them in.',
  );
}

// Optional, with defaults. Set on process.env so code that reads it
// directly (such as cors in app.js) sees the same value.
process.env.CLIENT_ORIGIN ??= 'http://localhost:5173'; // Vite's dev server
process.env.PORT ??= '3000';

// JWT_EXPIRES_IN is optional too (default '7d', set in auth.controller.js).
// Check its format now, or a typo like "7 dayz" would only fail at the
// first login.
if (process.env.JWT_EXPIRES_IN) {
  try {
    jwt.sign({}, 'format-check', { expiresIn: process.env.JWT_EXPIRES_IN });
  } catch {
    throw new Error(
      `JWT_EXPIRES_IN="${process.env.JWT_EXPIRES_IN}" isn't a valid duration. `
        + 'Use a value like "7d", "12h" or "3600" (seconds).',
    );
  }
}

const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  PORT: Number(process.env.PORT),
};

export default env;
