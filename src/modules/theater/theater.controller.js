import ApiResponse from "../../common/utils/api-response.js";
import * as theaterService from "./theater.service.js";

const createTheater = async (req, res) => {
  const theater = await theaterService.createTheater(req.body);
  ApiResponse.created(res, "Theater created", theater);
};

const createScreen = async (req, res) => {
  const screen = await theaterService.createScreen(req.params.theaterId, req.body);
  ApiResponse.created(res, "Screen created", screen);
};

const listTheaters = async (req, res) => {
  const { city } = req.query;
  const theaters = await theaterService.listTheaters({ city });
  ApiResponse.ok(res, "Theaters fetched", theaters);
};

const getTheaterById = async (req, res) => {
  const result = await theaterService.getTheaterById(req.params.id);
  ApiResponse.ok(res, "Theater fetched", result);
};

const getScreenById = async (req, res) => {
  const screen = await theaterService.getScreenById(req.params.screenId);
  ApiResponse.ok(res, "Screen fetched", screen);
};

export { createTheater, createScreen, listTheaters, getTheaterById, getScreenById };
