// Entry point for real runs (npm run dev / npm start): check the env,
// connect to MongoDB, then start listening. Tests never import this file;
// they import app.js and connect to an in-memory database instead.
import { env } from "./config/env.js"; // first, so .env is loaded and checked
import mongoose from "mongoose";
import app from "./app.js";

await mongoose.connect(env.MONGODB_URI, { dbName: env.DB_NAME });
console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
