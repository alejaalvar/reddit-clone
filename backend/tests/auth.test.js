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
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

// ========== helpers ==========
const alice = {
  username: "alice",
  email: "alice@example.com",
  password: "correct-horse-battery",
};

// stand-ins
let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  // Set before importing the app so a fail-fast env check passes and
  // dotenv never points the tests at the real Atlas database.
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = "test-secret-not-for-production";
  process.env.CLIENT_ORIGIN = "http://localhost:5173";
  await mongoose.connect(mongo.getUri());
  ({ default: app } = await import("../src/app.js"));
}, 120_000); // first run downloads a MongoDB binary

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

// ========== tests ==========

describe("POST /api/auth/register", () => {
  it("creates an account and returns a token and the user, never the password", async () => {
    const res = await request(app).post("/api/auth/register").send(alice);

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({
      username: "alice",
      email: "alice@example.com",
    });
    expect(typeof res.body.user._id).toBe("string");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in a registered user and returns a token and the user", async () => {
    await request(app).post("/api/auth/register").send(alice).expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "correct-horse-battery" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({ username: "alice" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a wrong password with 401 UNAUTHORIZED and no token", async () => {
    await request(app).post("/api/auth/register").send(alice).expect(201);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "wrong-password-123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatchObject({ code: "UNAUTHORIZED" });
    expect(typeof res.body.error.message).toBe("string");
    expect(res.body).not.toHaveProperty("token");
  });

  it("rejects an unknown username with the same 401 as a wrong password", async () => {
    await request(app).post("/api/auth/register").send(alice).expect(201);

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "wrong-password-123" });
    const unknownUser = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody", password: "correct-horse-battery" });

    expect(unknownUser.status).toBe(401);
    expect(unknownUser.body.error).toMatchObject({ code: "UNAUTHORIZED" });
    expect(unknownUser.body).not.toHaveProperty("token");
    // Same message either way, so the response doesn't reveal which usernames exist
    expect(unknownUser.body.error.message).toBe(wrongPassword.body.error.message);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the logged-in user when given that user's token", async () => {
    const { body } = await request(app)
      .post("/api/auth/register")
      .send(alice)
      .expect(201);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: "alice",
      email: "alice@example.com",
    });
  });
});
