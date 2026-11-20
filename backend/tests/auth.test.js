/**
 * Black-box tests for the auth routes (spec: "REST API" and "Auth flow").
 * Each test talks to the Express app over HTTP and checks only the
 * status codes and JSON shapes the spec promises.
 *
 * Contract this assumes: src/app.js default-exports the Express app
 * without connecting to Mongo or listening (server.js does that).
 *
 * Run: npm test   (inside backend/)
 */
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ========== helpers ==========
const alice = {
  username: 'alice',
  email: 'alice@example.com',
  password: 'correct-horse-battery',
};

// stand-ins
let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  // Set before importing the app so a fail-fast env check passes and
  // dotenv never points the tests at the real Atlas database.
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret-not-for-production';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  await mongoose.connect(mongo.getUri());
  ({ default: app } = await import('../src/app.js'));
}, 120_000); // first run downloads a MongoDB binary

// Empty every collection but keep it, with its indexes. dropDatabase() would
// also delete the unique indexes, which Mongoose builds only once, so later
// tests would accept duplicate usernames and emails.
async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

afterEach(clearDatabase);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

// ========== tests ==========

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token and the user, never the password', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      username: 'alice',
      email: 'alice@example.com',
    });
    expect(typeof res.body.user._id).toBe('string');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns a token for that user that expires in 7 days by default', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);

    // Spec, Auth flow step 3: { sub, username }, signed with JWT_SECRET,
    // expiresIn JWT_EXPIRES_IN, which defaults to '7d'
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ sub: res.body.user._id, username: 'alice' });
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it("uses JWT_EXPIRES_IN for the token lifetime when it's set", async () => {
    process.env.JWT_EXPIRES_IN = '1h';
    try {
      const res = await request(app).post('/api/auth/register').send(alice);

      const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(payload.exp - payload.iat).toBe(60 * 60);
    } finally {
      delete process.env.JWT_EXPIRES_IN; // don't leak into other tests
    }
  });

  it('rejects a taken username with 409 DUPLICATE, ignoring case', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, username: 'ALICE', email: 'other@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'DUPLICATE' });
    expect(res.body.error.fields).toHaveProperty('username');
    expect(res.body).not.toHaveProperty('token');
  });

  it('rejects a taken email with 409 DUPLICATE', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, username: 'alice2' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'DUPLICATE' });
    expect(res.body.error.fields).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('token');
  });

  // Spec: the password must be at least 8 characters and at most 72 bytes,
  // since bcrypt ignores anything past 72 bytes.
  it.each([
    ['no password', undefined],
    ['a password that is an object', { $gt: '' }],
    ['a 7-character password', 'abcdefg'],
    ['a 73-byte password', 'a'.repeat(73)],
    // 19 characters, so a character count would accept it, but 76 bytes
    ['a password of 19 emoji (76 bytes)', '🔑'.repeat(19)],
  ])('rejects %s with 400 VALIDATION_ERROR', async (_description, password) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, password });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(res.body.error.fields).toHaveProperty('password');
    expect(res.body).not.toHaveProperty('token');
  });

  it.each([
    ['exactly 8 characters', 'abcdefgh'],
    ['exactly 72 bytes', 'a'.repeat(72)],
  ])('accepts a password of %s', async (_description, password) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, password });

    expect(res.status).toBe(201);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in a registered user and returns a token and the user', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'correct-horse-battery' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ username: 'alice' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password with 401 UNAUTHORIZED and no token', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrong-password-123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body).not.toHaveProperty('token');
  });

  it('rejects an unknown username with the same 401 as a wrong password', async () => {
    await request(app).post('/api/auth/register').send(alice).expect(201);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrong-password-123' });
    const unknownUser = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'correct-horse-battery' });

    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body.error).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(unknownUser.body).not.toHaveProperty('token');
    // Same message either way, so the response doesn't reveal which usernames exist
    expect(unknownUser.body.error.message).toBe(wrongPassword.body.error.message);
  });

  // Spec: 400 for missing fields. A non-string value counts as invalid too:
  // express.json() accepts objects, and { "$gt": "" } passed to findOne
  // would match the first user in the database (NoSQL injection).
  describe('rejects missing or invalid fields with 400 VALIDATION_ERROR', () => {
    beforeEach(async () => {
      // A real user exists, so a 400 can't be a side effect of "user not found"
      await request(app).post('/api/auth/register').send(alice).expect(201);
    });

    it.each([
      ['no username', { password: 'correct-horse-battery' }, 'username'],
      ['an empty username', { username: '', password: 'correct-horse-battery' }, 'username'],
      ['a username that is an object', { username: { $gt: '' }, password: 'correct-horse-battery' }, 'username'],
      ['no password', { username: 'alice' }, 'password'],
      ['an empty password', { username: 'alice', password: '' }, 'password'],
      ['a password that is an object', { username: 'alice', password: { $gt: '' } }, 'password'],
    ])('%s', async (_description, body, badField) => {
      const res = await request(app).post('/api/auth/login').send(body);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatchObject({ code: 'VALIDATION_ERROR' });
      expect(res.body.error.fields).toHaveProperty(badField);
      expect(res.body).not.toHaveProperty('token');
    });
  });
});

describe('GET /api/auth/me', () => {
  it("returns the logged-in user when given that user's token", async () => {
    const { body } = await request(app)
      .post('/api/auth/register')
      .send(alice)
      .expect(201);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: 'alice',
      email: 'alice@example.com',
    });
  });

  // Spec: 401 for a missing or expired token, in the standard error shape
  function expectUnauthorized(res) {
    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(res.body).not.toHaveProperty('user');
  }

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');

    expectUnauthorized(res);
  });

  it("rejects a token that isn't a JWT", async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expectUnauthorized(res);
  });

  it('rejects a token signed with a different secret', async () => {
    const { body } = await request(app)
      .post('/api/auth/register')
      .send(alice)
      .expect(201);
    const forged = jwt.sign(
      { sub: body.user._id, username: 'alice' },
      'attacker-guessed-secret',
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forged}`);

    expectUnauthorized(res);
  });

  it('rejects an expired token', async () => {
    const { body } = await request(app)
      .post('/api/auth/register')
      .send(alice)
      .expect(201);
    const expired = jwt.sign(
      {
        sub: body.user._id,
        username: 'alice',
        exp: Math.floor(Date.now() / 1000) - 60, // expired a minute ago
      },
      process.env.JWT_SECRET,
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expectUnauthorized(res);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { body } = await request(app)
      .post('/api/auth/register')
      .send(alice)
      .expect(201);
    // The API has no delete-account route, so wipe the database directly.
    // The token itself is still validly signed and unexpired.
    await clearDatabase();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expectUnauthorized(res);
  });
});
