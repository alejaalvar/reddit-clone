import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';

const BCRYPT_ROUNDS = 12;

// Login compares against this when the username doesn't exist, so an unknown
// username takes as long as a wrong password and response times don't reveal
// which usernames are registered. Same cost factor as real hashes, so the
// compare takes the same time.
// The password is random and never stored, so nobody can log in with it.
const DUMMY_HASH = await bcrypt.hash(
  crypto.randomBytes(32).toString('hex'),
  BCRYPT_ROUNDS,
);

// The default lives here, not in config/env.js, because the tests import
// app.js without loading env.js.
const DEFAULT_JWT_EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN },
  );
}

const PASSWORD_MIN_CHARS = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything past 72 bytes

// Returns an error message, or null if the password is fine. The model can't
// check this because it only ever sees the hash.
function checkPassword(password) {
  if (typeof password !== 'string' || password === '') {
    return 'Password is required';
  }
  // Count characters as code points, so an emoji counts as one
  if ([...password].length < PASSWORD_MIN_CHARS) {
    return `Password must be at least ${PASSWORD_MIN_CHARS} characters`;
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes`;
  }
  return null;
}

export async function register(req, res) {
  // req.body is undefined when a request has no JSON body
  const { username, email, password } = req.body ?? {};

  const passwordError = checkPassword(password);
  if (passwordError) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some fields are invalid', {
      password: passwordError,
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ username, email, passwordHash });
  res.status(201).json({ token: signToken(user), user });
}

export async function login(req, res) {
  // req.body is undefined when a request has no JSON body
  const { username, password } = req.body ?? {};

  // Strings only: an object like { "$gt": "" } would turn findOne into a
  // query that matches any user (NoSQL injection)
  const fields = {};
  if (typeof username !== 'string' || username === '') {
    fields.username = 'Username is required';
  }
  if (typeof password !== 'string' || password === '') {
    fields.password = 'Password is required';
  }
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Some fields are invalid', fields);
  }

  const user = await User.findOne({ username: username.toLowerCase() }).select(
    '+passwordHash',
  );
  // Always run a full bcrypt compare, even for an unknown username
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  // A matching dummy hash must never count as a login
  if (!user || !passwordMatches) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Wrong username or password');
  }
  res.status(200).json({ token: signToken(user), user });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  // The token can outlive its account; treat that like a bad token
  if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Please log in');
  res.status(200).json({ user });
}
