import mongoose from "mongoose";

const showSeatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true,
    },
    row: {
      type: String,
      required: true,
      uppercase: true, // e.g. "A"
    },
    col: {
      type: Number,
      required: true,
      min: 1, // e.g. 1
    },
    seatNo: {
      type: String,
      required: true, // e.g. "A1" — stored to avoid recomputing on every read
    },
    type: {
      type: String,
      enum: ["regular", "premium", "vip"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      // Snapshot of Show.pricing[type] at ShowSeat generation time.
      // Intentional: price must not change retroactively for already-generated seats.
    },

    // --- Booking state machine ---
    // available → locked  (user selects seat)
    // locked    → booked  (payment confirmed)
    // locked    → available (lock expired or user abandoned)
    // booked    → available (booking cancelled + refund)
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
      index: true,
    },

    // Set when status = "locked". Cleared on booked or available.
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // TTL anchor: if now > lockedUntil and status = "locked", the lock is stale
    // A cleanup job queries { status: "locked", lockedUntil: { $lt: now } }
    lockedUntil: {
      type: Date,
      default: null,
    },

    // Set permanently when status = "booked"
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true },
);

// The most important index: "give me all available seats for show X"
// This is hit on every seat map render
showSeatSchema.index({ show: 1, status: 1 });

// Uniqueness guarantee: one ShowSeat document per physical seat per show
// This is the database-level guard against duplicate seat generation
showSeatSchema.index({ show: 1, row: 1, col: 1 }, { unique: true });

// Used by the lock-cleanup job to find stale locks efficiently
showSeatSchema.index({ lockedUntil: 1 }, { sparse: true });

export default mongoose.model("ShowSeat", showSeatSchema);
