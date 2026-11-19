// Builds and exports the Express app. It must not connect to Mongo or
// listen on a port: src/index.js does that for real runs, and the tests
// connect to an in-memory database themselves.
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use("/api/auth", authRoutes);

// Must come after every route
app.use(errorHandler);

export default app;
