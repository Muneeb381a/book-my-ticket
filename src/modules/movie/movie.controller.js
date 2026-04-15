import ApiResponse from "../../common/utils/api-response.js";
import * as movieService from "./movie.service.js";

const createMovie = async (req, res) => {
  const movie = await movieService.createMovie(req.body);
  ApiResponse.created(res, "Movie created", movie);
};

const listMovies = async (req, res) => {
  const { page, limit, genre, language } = req.query;
  const result = await movieService.listMovies({ page, limit, genre, language });
  ApiResponse.ok(res, "Movies fetched", result);
};

const getMovieById = async (req, res) => {
  const movie = await movieService.getMovieById(req.params.id);
  ApiResponse.ok(res, "Movie fetched", movie);
};

const updateMovie = async (req, res) => {
  const movie = await movieService.updateMovie(req.params.id, req.body);
  ApiResponse.ok(res, "Movie updated", movie);
};

const deleteMovie = async (req, res) => {
  await movieService.deleteMovie(req.params.id);
  ApiResponse.noContent(res);
};

export { createMovie, listMovies, getMovieById, updateMovie, deleteMovie };
