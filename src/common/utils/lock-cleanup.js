import ShowSeat from "../../modules/show/show-seat.model.js";
import Show from "../../modules/show/show.model.js";

// finds expired locks and releases them back to available
const releaseStaleSeatlocks = async () => {
  const staleSeats = await ShowSeat.find({
    status: "locked",
    lockedUntil: { $lt: new Date() },
  }).select("_id show");

  if (staleSeats.length === 0) return;

  // group by show so we do one $inc per show instead of N
  const countByShow = staleSeats.reduce((acc, seat) => {
    const id = seat.show.toString();
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const staleIds = staleSeats.map((s) => s._id);

  await ShowSeat.updateMany(
    { _id: { $in: staleIds } },
    { status: "available", lockedBy: null, lockedUntil: null },
  );

  await Promise.all(
    Object.entries(countByShow).map(([showId, count]) =>
      Show.findByIdAndUpdate(showId, { $inc: { availableSeats: count } }),
    ),
  );

  console.log(`[cleanup] released ${staleIds.length} expired seat lock(s)`);
};

const startLockCleanupJob = () => {
  const INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
  setInterval(async () => {
    try {
      await releaseStaleSeatlocks();
    } catch (err) {
      console.error("[cleanup] failed:", err.message);
    }
  }, INTERVAL_MS);

  console.log("[cleanup] seat lock cleanup running every 2 minutes");
};

export { startLockCleanupJob, releaseStaleSeatlocks };
