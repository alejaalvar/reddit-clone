// Builds and exports the Express app. It must not connect to Mongo or
// listen on a port: src/server.js does that for real runs, and the tests
// connect to an in-memory database themselves.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import errorHandler from './middleware/errorHandler.js';
import communityRoutes from './routes/community.routes.js';
import postRoutes from './routes/post.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);

app.use('/api/auth', authRoutes);

// Must come after every route
app.use(errorHandler);

export default app;
