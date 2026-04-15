import mongoose from "mongoose";
import crypto from "crypto";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },
    seats: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "ShowSeat" }],
      validate: {
        validator: (v) => v.length > 0,
        message: "A booking must include at least one seat",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: { type: String, default: null },

    // e.g. "BMS-20250415-A3F9C2" — generated in pre-save hook
    bookingRef: {
      type: String,
      unique: true,
    },

    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1, createdAt: -1 }); // "my bookings" sorted newest first
bookingSchema.index({ show: 1, user: 1 });        // duplicate booking guard

// Generate bookingRef before first save
bookingSchema.pre("save", function (next) {
  if (!this.bookingRef) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
    this.bookingRef = `BMS-${date}-${suffix}`; // e.g. BMS-20250415-A3F9C2
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);
