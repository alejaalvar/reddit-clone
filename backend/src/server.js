// Entry point for real runs (npm run dev / npm start): check the env,
// connect to MongoDB, then start listening. Tests never import this file;
// they import app.js and connect to an in-memory database instead.
/* eslint-disable no-console -- startup messages for whoever runs the server */
import mongoose from 'mongoose';
import env from './config/env.js'; // before app.js, so .env is loaded and checked first
import app from './app.js';

await mongoose.connect(env.MONGODB_URI, { dbName: env.DB_NAME });
console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
