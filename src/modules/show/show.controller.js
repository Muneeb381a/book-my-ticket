import ApiResponse from "../../common/utils/api-response.js";
import * as showService from "./show.service.js";

const createShow = async (req, res) => {
  const show = await showService.createShow(req.body);
  ApiResponse.created(res, "Show created", show);
};

const listShows = async (req, res) => {
  const { movieId, city, date, page, limit } = req.query;
  const result = await showService.listShows({ movieId, city, date, page, limit });
  ApiResponse.ok(res, "Shows fetched", result);
};

const getShowSeatMap = async (req, res) => {
  const result = await showService.getShowSeatMap(req.params.id);
  ApiResponse.ok(res, "Seat map fetched", result);
};

const cancelShow = async (req, res) => {
  const show = await showService.cancelShow(req.params.id);
  ApiResponse.ok(res, "Show cancelled", show);
};

export { createShow, listShows, getShowSeatMap, cancelShow };
