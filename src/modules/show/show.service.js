import ApiError from "../../common/utils/api-error.js";
import Movie from "../movie/movie.model.js";
import Theater from "../theater/theater.model.js";
import Screen from "../theater/screen.model.js";
import Show from "./show.model.js";
import ShowSeat from "./show-seat.model.js";

const createShow = async ({ movieId, screenId, startTime, pricing }) => {
  // 1. Validate movie and screen exist
  const [movie, screen] = await Promise.all([
    Movie.findById(movieId),
    Screen.findById(screenId),
  ]);
  if (!movie || !movie.isActive) throw ApiError.notfound("Movie not found");
  if (!screen || !screen.isActive) throw ApiError.notfound("Screen not found");

  // 2. Calculate end time from movie duration
  const start = new Date(startTime);
  const end   = new Date(start.getTime() + movie.durationMins * 60 * 1000);

  // 3. Overlap check: reject if screen already has a non-cancelled show during this window
  const overlap = await Show.findOne({
    screen: screenId,
    status: { $nin: ["cancelled"] },
    startTime: { $lt: end },
    endTime:   { $gt: start },
  });
  if (overlap) {
    throw ApiError.conflict(
      `Screen already has a show from ${overlap.startTime.toISOString()} to ${overlap.endTime.toISOString()}`,
    );
  }

  // 4. Only include active seats in the show
  const activeSeats = screen.seatMap.filter((s) => s.isActive);
  if (activeSeats.length === 0) {
    throw ApiError.badRequest("Screen has no active seats");
  }

  // 5. Create Show document
  const show = await Show.create({
    movie:          movieId,
    screen:         screenId,
    startTime:      start,
    endTime:        end,
    pricing,
    availableSeats: activeSeats.length,
    status:         "scheduled",
  });

  // 6. Generate ShowSeat documents — one per active seat in the screen's seatMap
  //    Price is snapshotted here; future pricing changes won't affect this show.
  const showSeats = activeSeats.map((seat) => ({
    show:   show._id,
    row:    seat.row,
    col:    seat.col,
    seatNo: seat.seatNo,
    type:   seat.type,
    price:  pricing[seat.type],
    status: "available",
  }));

  // ordered: false — if any seat fails the unique index (duplicate), others still insert
  await ShowSeat.insertMany(showSeats, { ordered: false });

  return show;
};

const listShows = async ({ movieId, city, date, page = 1, limit = 10 } = {}) => {
  const filter = {
    status:    "scheduled",
    startTime: { $gt: new Date() },
  };

  if (movieId) filter.movie = movieId;

  // City filter requires resolving theater → screen → show chain
  if (city) {
    const theaters = await Theater.find({ city: city.toLowerCase().trim(), isActive: true }).select("_id");
    const theaterIds = theaters.map((t) => t._id);
    const screens = await Screen.find({ theater: { $in: theaterIds }, isActive: true }).select("_id");
    filter.screen = { $in: screens.map((s) => s._id) };
  }

  if (date) {
    const day = new Date(date);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd   = new Date(day.setHours(23, 59, 59, 999));
    filter.startTime = { $gte: dayStart, $lte: dayEnd };
  }

  const skip = (page - 1) * limit;
  const [shows, total] = await Promise.all([
    Show.find(filter)
      .populate("movie", "title durationMins language posterUrl")
      .populate({
        path:     "screen",
        select:   "name totalSeats",
        populate: { path: "theater", select: "name city address" },
      })
      .skip(skip)
      .limit(limit)
      .sort({ startTime: 1 }),
    Show.countDocuments(filter),
  ]);

  return { shows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

// Returns the show details + full seat map for the seat selection UI
const getShowSeatMap = async (showId) => {
  const [show, seats] = await Promise.all([
    Show.findById(showId)
      .populate("movie", "title durationMins language")
      .populate({
        path:     "screen",
        select:   "name",
        populate: { path: "theater", select: "name city address" },
      }),
    ShowSeat.find({ show: showId })
      .select("row col seatNo type price status")
      .sort({ row: 1, col: 1 }),
  ]);

  if (!show) throw ApiError.notfound("Show not found");
  if (show.status === "cancelled") throw ApiError.badRequest("This show has been cancelled");

  return { show, seats };
};

const cancelShow = async (showId) => {
  const show = await Show.findById(showId);
  if (!show) throw ApiError.notfound("Show not found");
  if (show.status === "cancelled") throw ApiError.badRequest("Show is already cancelled");
  if (show.status === "completed") throw ApiError.badRequest("Cannot cancel a completed show");

  show.status = "cancelled";
  await show.save();

  // Release any locked seats so users aren't stranded
  await ShowSeat.updateMany(
    { show: showId, status: "locked" },
    { status: "available", lockedBy: null, lockedUntil: null },
  );

  return show;
};

export { createShow, listShows, getShowSeatMap, cancelShow };
