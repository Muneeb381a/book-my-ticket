import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";
import { startLockCleanupJob } from "./src/common/utils/lock-cleanup.js";

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  // local dev: connect DB, start cleanup job, start HTTP server
  const start = async () => {
    await connectDB();
    startLockCleanupJob();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  };

  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

// Vercel needs the Express app exported as default.
// DB connection is handled per-request in app.js middleware.
export default app;
