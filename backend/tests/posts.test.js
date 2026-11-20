import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
let app;
let Post;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  await mongoose.connect(mongod.getUri());
  ({ default: app } = await import('../src/app.js'));
  ({ default: Post } = await import('../src/models/Post.js'));
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

async function setup() {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });
  const auth = { Authorization: `Bearer ${reg.body.token}` };
  const community = await request(app)
    .post('/api/communities')
    .set(auth)
    .send({ name: 'webdev' });
  return { auth, communityId: community.body.community._id };
}

function createPost(auth, body) {
  return request(app).post('/api/posts').set(auth).send(body);
}

describe('POST /api/posts', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/posts').send({ title: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('creates a post in a community', async () => {
    const { auth, communityId } = await setup();
    const res = await createPost(auth, {
      communityId,
      title: 'Hello',
      body: 'First post',
    });
    expect(res.status).toBe(201);
    expect(res.body.post).toMatchObject({
      title: 'Hello',
      body: 'First post',
      author: { username: 'alice' },
      community: { name: 'webdev' },
      score: 0,
      commentCount: 0,
      myVote: 0,
    });
  });

  it('returns 400 when the title is missing', async () => {
    const { auth, communityId } = await setup();
    const res = await createPost(auth, { communityId, body: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.title).toBeDefined();
  });

  it('returns 404 for an unknown community', async () => {
    const { auth } = await setup();
    const res = await createPost(auth, {
      communityId: new mongoose.Types.ObjectId().toString(),
      title: 'Lost',
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/posts', () => {
  it('returns posts newest first without the body', async () => {
    const { auth, communityId } = await setup();
    await createPost(auth, { communityId, title: 'old', body: 'text' });
    await createPost(auth, { communityId, title: 'new', body: 'text' });
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body.posts.map((p) => p.title)).toEqual(['new', 'old']);
    expect(res.body.posts[0].body).toBeUndefined();
    expect(res.body.posts[0]).toMatchObject({
      myVote: 0,
      author: { username: 'alice' },
    });
    expect(res.body).toMatchObject({ page: 1, hasMore: false });
  });

  it('sorts by score with sort=top', async () => {
    const { auth, communityId } = await setup();
    await createPost(auth, { communityId, title: 'low' });
    const high = await createPost(auth, { communityId, title: 'high' });
    await createPost(auth, { communityId, title: 'newest' });
    // Scores are only changed by the voting code, so set one directly here
    await Post.updateOne({ _id: high.body.post._id }, { $set: { score: 5 } });
    const res = await request(app).get('/api/posts?sort=top');
    expect(res.body.posts.map((p) => p.title)).toEqual([
      'high',
      'newest',
      'low',
    ]);
  });

  it('returns 400 for a bad sort', async () => {
    const res = await request(app).get('/api/posts?sort=hot');
    expect(res.status).toBe(400);
  });

  it('filters by community and returns 404 for an unknown one', async () => {
    const { auth, communityId } = await setup();
    const other = await request(app)
      .post('/api/communities')
      .set(auth)
      .send({ name: 'cooking' });
    await createPost(auth, { communityId, title: 'in webdev' });
    await createPost(auth, {
      communityId: other.body.community._id,
      title: 'in cooking',
    });
    const res = await request(app).get('/api/posts?community=webdev');
    expect(res.body.posts.map((p) => p.title)).toEqual(['in webdev']);
    const missing = await request(app).get('/api/posts?community=nope');
    expect(missing.status).toBe(404);
  });

  it('pages results and reports hasMore', async () => {
    const { auth, communityId } = await setup();
    await createPost(auth, { communityId, title: 'one' });
    await createPost(auth, { communityId, title: 'two' });
    const first = await request(app).get('/api/posts?limit=1');
    expect(first.body.posts.map((p) => p.title)).toEqual(['two']);
    expect(first.body.hasMore).toBe(true);
    const second = await request(app).get('/api/posts?limit=1&page=2');
    expect(second.body.posts.map((p) => p.title)).toEqual(['one']);
    expect(second.body.hasMore).toBe(false);
  });
});
