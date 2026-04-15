import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateMovieDto from "./dto/create-movie.dto.js";
import * as controller from "./movie.controller.js";

const router = Router();

// Public
router.get("/", controller.listMovies);
router.get("/:id", controller.getMovieById);

// Admin only
router.post(   "/", authenticate, authorize("admin"), validate(CreateMovieDto), controller.createMovie);
router.patch(  "/:id", authenticate, authorize("admin"), controller.updateMovie);
router.delete( "/:id", authenticate, authorize("admin"), controller.deleteMovie);

export default router;
