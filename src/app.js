import cookieParser from "cookie-parser";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./common/config/swagger.js";
import authRoute    from "./modules/auth/auth.routes.js";
import movieRoute   from "./modules/movie/movie.routes.js";
import theaterRoute from "./modules/theater/theater.routes.js";
import showRoute    from "./modules/show/show.routes.js";
import bookingRoute from "./modules/booking/booking.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// api docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "BookMyTicket API" }));

// routes
app.use("/api/auth",     authRoute);
app.use("/api/movies",   movieRoute);
app.use("/api/theaters", theaterRoute);
app.use("/api/shows",    showRoute);
app.use("/api/bookings", bookingRoute);

// global error handler
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
