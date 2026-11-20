import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  await mongoose.connect(mongod.getUri());
  ({ default: app } = await import('../src/app.js'));
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}, 120_000); // first run downloads a MongoDB binary

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function registerUser(username) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username,
      email: `${username}@example.com`,
      password: 'password123',
    });
  return res.body.token;
}

function createCommunity(token, body) {
  return request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

describe('POST /api/communities', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/communities')
      .send({ name: 'webdev' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('creates a community with a lowercase name and the creator', async () => {
    const token = await registerUser('alice');
    const res = await createCommunity(token, {
      name: 'WebDev',
      description: 'Web stuff',
    });
    expect(res.status).toBe(201);
    expect(res.body.community).toMatchObject({
      name: 'webdev',
      description: 'Web stuff',
      creator: { username: 'alice' },
    });
  });

  it('returns 400 for an invalid name', async () => {
    const token = await registerUser('alice');
    const res = await createCommunity(token, { name: 'not valid!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when the name is missing', async () => {
    const token = await registerUser('alice');
    const res = await createCommunity(token, {});
    expect(res.status).toBe(400);
  });

  it('returns 409 when the name is taken', async () => {
    const token = await registerUser('alice');
    await createCommunity(token, { name: 'webdev' });
    const res = await createCommunity(token, { name: 'WEBDEV' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });
});

describe('GET /api/communities', () => {
  it('lists communities sorted by name', async () => {
    const token = await registerUser('alice');
    await createCommunity(token, { name: 'music' });
    await createCommunity(token, { name: 'cooking' });
    const res = await request(app).get('/api/communities');
    expect(res.status).toBe(200);
    expect(res.body.communities.map((c) => c.name)).toEqual([
      'cooking',
      'music',
    ]);
    expect(res.body).toMatchObject({ page: 1, hasMore: false });
  });

  it('pages results and reports hasMore', async () => {
    const token = await registerUser('alice');
    await createCommunity(token, { name: 'aaa' });
    await createCommunity(token, { name: 'bbb' });
    const first = await request(app).get('/api/communities?limit=1');
    expect(first.body.communities.map((c) => c.name)).toEqual(['aaa']);
    expect(first.body.hasMore).toBe(true);
    const second = await request(app).get('/api/communities?limit=1&page=2');
    expect(second.body.communities.map((c) => c.name)).toEqual(['bbb']);
    expect(second.body.hasMore).toBe(false);
  });
});

describe('GET /api/communities/:name', () => {
  it('returns the community, ignoring case', async () => {
    const token = await registerUser('alice');
    await createCommunity(token, { name: 'webdev' });
    const res = await request(app).get('/api/communities/WebDev');
    expect(res.status).toBe(200);
    expect(res.body.community.name).toBe('webdev');
  });

  it('returns 404 for an unknown community', async () => {
    const res = await request(app).get('/api/communities/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
