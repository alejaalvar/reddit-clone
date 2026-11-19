import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { HttpError } from "../utils/HttpError.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const BCRYPT_ROUNDS = 12;

// Login compares against this when the username doesn't exist, so an unknown
// username takes as long as a wrong password and response times don't reveal
// which usernames are registered. Same cost factor as real hashes, so the
// compare takes the same time.
// The password is random and never stored, so nobody can log in with it.
const DUMMY_HASH = await bcrypt.hash(
  crypto.randomBytes(32).toString("hex"),
  BCRYPT_ROUNDS,
);

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ username, email, passwordHash });
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username.toLowerCase() }).select(
    "+passwordHash",
  );
  // Always run a full bcrypt compare, even for an unknown username
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  // A matching dummy hash must never count as a login
  if (!user || !passwordMatches) {
    throw new HttpError(401, "UNAUTHORIZED", "Wrong username or password");
  }
  res.status(200).json({ token: signToken(user), user });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  // The token can outlive its account; treat that like a bad token
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Please log in");
  res.status(200).json({ user });
});

export default router;
