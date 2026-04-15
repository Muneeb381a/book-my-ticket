import ApiError from "../../common/utils/api-error.js";
import Theater from "./theater.model.js";
import Screen from "./screen.model.js";

const createTheater = async (data) => {
  const theater = await Theater.create(data);
  return theater;
};

const createScreen = async (theaterId, { name, seatMap }) => {
  const theater = await Theater.findById(theaterId);
  if (!theater || !theater.isActive) throw ApiError.notfound("Theater not found");

  // Build seatNo from row + col (e.g. row "A", col 3 → "A3")
  const processedSeatMap = seatMap.map((seat) => ({
    ...seat,
    row:    seat.row.toUpperCase(),
    seatNo: `${seat.row.toUpperCase()}${seat.col}`,
  }));

  // Enforce uniqueness of row+col within the seat map before hitting DB
  const seatKeys = processedSeatMap.map((s) => `${s.row}${s.col}`);
  const uniqueKeys = new Set(seatKeys);
  if (uniqueKeys.size !== seatKeys.length) {
    throw ApiError.badRequest("Seat map contains duplicate row/col combinations");
  }

  const screen = await Screen.create({
    theater: theaterId,
    name,
    seatMap: processedSeatMap,
    totalSeats: processedSeatMap.filter((s) => s.isActive !== false).length,
  });

  return screen;
};

const listTheaters = async ({ city } = {}) => {
  const filter = { isActive: true };
  if (city) filter.city = city.toLowerCase().trim();
  return Theater.find(filter).sort({ name: 1 });
};

const getTheaterById = async (id) => {
  const [theater, screens] = await Promise.all([
    Theater.findById(id),
    Screen.find({ theater: id, isActive: true }).select("-seatMap"), // seatMap is heavy; omit from listing
  ]);
  if (!theater || !theater.isActive) throw ApiError.notfound("Theater not found");
  return { theater, screens };
};

const getScreenById = async (screenId) => {
  const screen = await Screen.findById(screenId).populate("theater", "name city address");
  if (!screen || !screen.isActive) throw ApiError.notfound("Screen not found");
  return screen;
};

export { createTheater, createScreen, listTheaters, getTheaterById, getScreenById };
