import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import connectDB from "./common/config/db.js";
import { swaggerSpec } from "./common/config/swagger.js";
import authRoute    from "./modules/auth/auth.routes.js";
import movieRoute   from "./modules/movie/movie.routes.js";
import theaterRoute from "./modules/theater/theater.routes.js";
import showRoute    from "./modules/show/show.routes.js";
import bookingRoute from "./modules/booking/booking.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ensure DB is ready before every request — handles Vercel cold starts
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Swagger docs ─────────────────────────────────────────────────────────────
// Spec as JSON — referenced by the UI below
app.get("/api-docs/swagger.json", (_req, res) => res.json(swaggerSpec));

// Assets loaded from CDN so this works on Vercel (serverless can't serve node_modules)
app.get("/api-docs", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BookMyTicket API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });
    };
  </script>
</body>
</html>`);
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoute);
app.use("/api/movies",   movieRoute);
app.use("/api/theaters", theaterRoute);
app.use("/api/shows",    showRoute);
app.use("/api/bookings", bookingRoute);

// ── 404 catch-all — must sit after every route ───────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${_req.method} ${_req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join("; ");
  }

  if (err.name === "MongoServerError" && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with that ${field} already exists`;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = err.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid token. Please log in again.";
  }

  const safeMessage =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : message;

  const body = { success: false, message: safeMessage };
  if (process.env.NODE_ENV === "development") body.stack = err.stack;

  return res.status(statusCode).json(body);
});

export default app;
