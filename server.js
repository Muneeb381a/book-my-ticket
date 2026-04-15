import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";
import { startLockCleanupJob } from "./src/common/utils/lock-cleanup.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  startLockCleanupJob(); // release stale seat locks every 2 minutes
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
