import mongoose from "mongoose";

const showSeatSchema = new mongoose.Schema(
  {
    show:   { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    row:    { type: String, required: true, uppercase: true },
    col:    { type: Number, required: true, min: 1 },
    seatNo: { type: String, required: true }, // e.g. "A1"
    type:   { type: String, enum: ["regular", "premium", "vip"], required: true },

    // price is snapshotted from show pricing at creation time — never changes
    price:  { type: Number, required: true, min: 0 },

    // available → locked → booked (or back to available on cancel/expiry)
    status: { type: String, enum: ["available", "locked", "booked"], default: "available", index: true },

    lockedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lockedUntil: { type: Date, default: null },
    booking:     { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { timestamps: true },
);

showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ show: 1, row: 1, col: 1 }, { unique: true }); // prevent double seat generation
showSeatSchema.index({ lockedUntil: 1 }, { sparse: true });          // for cleanup job

export default mongoose.model("ShowSeat", showSeatSchema);
