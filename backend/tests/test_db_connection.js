/**
 * File: test_db_connection.js
 * To run: npm run test:db-connection anywhere inside the backend/
 * Expected output: Connected to reddit-dev → [ 'communities', 'posts', 'comments', 'users' ]
 *
 * This script verifies the conneciton to the dev database hosted
 * on MongoDB Atlas. If it fails, verify that you have created the
 * .env file inside of backend/ with the appropriate username,
 * password, and MONGODB_URI values.
 */

import "dotenv/config";
import mongoose from "mongoose";

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
  });
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log(
    "Connected to",
    mongoose.connection.name,
    "→",
    cols.map((c) => c.name),
  );
} catch (err) {
  console.error("Connection failed:", err.message);
} finally {
  await mongoose.disconnect();
}
