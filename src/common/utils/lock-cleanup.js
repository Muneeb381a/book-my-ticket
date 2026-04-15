import ShowSeat from "../../modules/show/show-seat.model.js";
import Show from "../../modules/show/show.model.js";

// Releases all ShowSeat locks whose TTL has passed.
// Should be called on a recurring interval (e.g. every 2 minutes).
const releaseStaleSeatlocks = async () => {
  const staleSeats = await ShowSeat.find({
    status:      "locked",
    lockedUntil: { $lt: new Date() },
  }).select("_id show");

  if (staleSeats.length === 0) return;

  // Group stale seats by show so we can do one $inc per show
  const showSeatCount = staleSeats.reduce((acc, seat) => {
    const key = seat.show.toString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const staleIds = staleSeats.map((s) => s._id);

  // Release the locks
  await ShowSeat.updateMany(
    { _id: { $in: staleIds } },
    { status: "available", lockedBy: null, lockedUntil: null },
  );

  // Restore availableSeats counter for each affected show
  const showUpdates = Object.entries(showSeatCount).map(([showId, count]) =>
    Show.findByIdAndUpdate(showId, { $inc: { availableSeats: count } }),
  );
  await Promise.all(showUpdates);

  console.log(`[LockCleanup] Released ${staleIds.length} stale seat lock(s)`);
};

// Call this once from server.js after DB connects.
// Runs every 2 minutes — short enough to recover locks before users give up,
// long enough to not hammer the DB.
const startLockCleanupJob = () => {
  const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  setInterval(async () => {
    try {
      await releaseStaleSeatlocks();
    } catch (err) {
      console.error("[LockCleanup] Error releasing stale locks:", err.message);
    }
  }, INTERVAL_MS);

  console.log("[LockCleanup] Stale lock cleanup job started (every 2 minutes)");
};

export { startLockCleanupJob, releaseStaleSeatlocks };
