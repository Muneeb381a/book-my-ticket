import ApiError from "../../common/utils/api-error.js";
import Movie from "./movie.model.js";

const createMovie = async (data) => {
  const movie = await Movie.create(data);
  return movie;
};

const listMovies = async ({ page = 1, limit = 10, genre, language } = {}) => {
  const filter = { isActive: true };
  if (genre)    filter.genre = genre;
  if (language) filter.language = new RegExp(language, "i");

  const skip = (page - 1) * limit;
  const [movies, total] = await Promise.all([
    Movie.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Movie.countDocuments(filter),
  ]);

  return { movies, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getMovieById = async (id) => {
  const movie = await Movie.findById(id);
  if (!movie || !movie.isActive) throw ApiError.notfound("Movie not found");
  return movie;
};

const updateMovie = async (id, data) => {
  const movie = await Movie.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!movie) throw ApiError.notfound("Movie not found");
  return movie;
};

// Soft delete — existing shows referencing this movie are unaffected
const deleteMovie = async (id) => {
  const movie = await Movie.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!movie) throw ApiError.notfound("Movie not found");
};

export { createMovie, listMovies, getMovieById, updateMovie, deleteMovie };
