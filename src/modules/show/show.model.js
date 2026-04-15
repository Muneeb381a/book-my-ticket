import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    regular: { type: Number, required: true, min: 0 },
    premium: { type: Number, required: true, min: 0 },
    vip:     { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie is required"],
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Screen",
      required: [true, "Screen is required"],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    pricing: {
      type: pricingSchema,
      required: [true, "Pricing is required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    // Denormalized count — kept in sync via $inc on every seat lock/release/booking
    // Avoids a COUNT query on ShowSeat for every show listing
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

// "All upcoming shows for movie X" — used on movie detail page
showSchema.index({ movie: 1, startTime: 1 });

// "All shows on screen X" — used for overlap detection when scheduling
showSchema.index({ screen: 1, startTime: 1 });

// "All upcoming active shows" — used for homepage listing
showSchema.index({ status: 1, startTime: 1 });

export default mongoose.model("Show", showSchema);
