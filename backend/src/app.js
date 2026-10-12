import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

import env from "./config/env.js";
import v1Router from "./routes/v1/index.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

// --- Security & parsing middleware (order matters) ---
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // required for HttpOnly cookies to be sent cross-origin
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (!env.isProduction) {
  app.use(morgan("dev"));
}

// --- Health check (useful for Railway/Render/uptime monitors) ---
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

// --- API routes ---
app.use("/api/v1", v1Router);

// --- 404 + global error handler (must be LAST, in this order) ---
app.use(notFound);
app.use(errorHandler);

export default app;
