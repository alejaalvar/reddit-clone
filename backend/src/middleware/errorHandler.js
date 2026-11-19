import { HttpError } from "../utils/HttpError.js";

// Maps every error to { error: { code, message, fields? } }.
// Express 5 forwards errors thrown in async handlers here.
export function errorHandler(err, req, res, next) {
  const send = (status, code, message, fields) =>
    res.status(status).json({ error: { code, message, ...(fields && { fields }) } });

  if (err instanceof HttpError) return send(err.status, err.code, err.message, err.fields);
  if (err.name === "ValidationError")
    return send(
      400,
      "VALIDATION_ERROR",
      "Some fields are invalid",
      Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message])),
    );
  if (err.name === "CastError") return send(404, "NOT_FOUND", "Not found");
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return send(409, "DUPLICATE", `That ${field} is already taken`, {
      [field]: "already taken",
    });
  }
  console.error(err);
  return send(500, "SERVER_ERROR", "Something went wrong");
}
