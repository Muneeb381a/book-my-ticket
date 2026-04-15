import mongoose from "mongoose";

const seatMapEntrySchema = new mongoose.Schema(
  {
    row:      { type: String, required: true, uppercase: true },
    col:      { type: Number, required: true, min: 1 },
    seatNo:   { type: String, required: true }, // e.g. "A3"
    type:     { type: String, enum: ["regular", "premium", "vip"], default: "regular" },
    isActive: { type: Boolean, default: true }, // false = broken seat, skipped on show creation
  },
  { _id: false },
);

const screenSchema = new mongoose.Schema(
  {
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: [true, "Theater is required"],
      index: true,
    },
    name:       { type: String, required: [true, "Screen name is required"], trim: true },
    totalSeats: { type: Number, required: [true, "Total seats is required"], min: 1 },
    seatMap: {
      type: [seatMapEntrySchema],
      validate: { validator: (v) => v.length > 0, message: "Screen must have at least one seat" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// no two screens in the same theater can share a name
screenSchema.index({ theater: 1, name: 1 }, { unique: true });

// keep totalSeats in sync whenever seatMap changes
screenSchema.pre("save", function (next) {
  if (this.isModified("seatMap")) {
    this.totalSeats = this.seatMap.filter((s) => s.isActive).length;
  }
  next();
});

export default mongoose.model("Screen", screenSchema);
