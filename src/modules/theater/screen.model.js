import mongoose from "mongoose";

const seatMapEntrySchema = new mongoose.Schema(
  {
    row: {
      type: String,
      required: true, // e.g. "A", "B", "C"
      uppercase: true,
    },
    col: {
      type: Number,
      required: true, // e.g. 1, 2, 3
      min: 1,
    },
    seatNo: {
      type: String,
      required: true, // e.g. "A1", "B12" — stored for fast reads, no computation at query time
    },
    type: {
      type: String,
      enum: ["regular", "premium", "vip"],
      default: "regular",
    },
    isActive: {
      type: Boolean,
      default: true, // false = broken/removed seat, excluded from ShowSeat generation
    },
  },
  { _id: false }, // no individual IDs needed on seat map entries
);

const screenSchema = new mongoose.Schema(
  {
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: [true, "Theater is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Screen name is required"],
      trim: true, // e.g. "Screen 1", "IMAX Hall"
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats is required"],
      min: 1,
      // This is derived from seatMap.filter(isActive).length
      // Stored here to avoid re-counting on every read
    },
    seatMap: {
      type: [seatMapEntrySchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "A screen must have at least one seat",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Compound unique index: a theater cannot have two screens with the same name
screenSchema.index({ theater: 1, name: 1 }, { unique: true });

// Before saving, sync totalSeats with the number of active seats in seatMap
screenSchema.pre("save", function (next) {
  if (this.isModified("seatMap")) {
    this.totalSeats = this.seatMap.filter((s) => s.isActive).length;
  }
  next();
});

export default mongoose.model("Screen", screenSchema);
