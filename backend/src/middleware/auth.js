import jwt from "jsonwebtoken";
import { HttpError } from "../utils/HttpError.js";

function readUser(req) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if bad or expired
  return { id: payload.sub, username: payload.username };
}

export function requireAuth(req, res, next) {
  try {
    req.user = readUser(req);
    if (!req.user) throw new Error("no token");
    next();
  } catch {
    next(new HttpError(401, "UNAUTHORIZED", "Please log in"));
  }
}
