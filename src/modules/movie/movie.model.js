import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    durationMins: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    genre: {
      type: [String],
      required: [true, "At least one genre is required"],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one genre is required",
      },
    },
    language: {
      type: String,
      required: [true, "Language is required"],
      trim: true,
    },
    releaseDate: {
      type: Date,
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Movie", movieSchema);
