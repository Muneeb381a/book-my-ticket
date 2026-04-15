import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateMovieDto from "./dto/create-movie.dto.js";
import * as controller from "./movie.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Movies
 *   description: Movie catalogue management
 */

/**
 * @openapi
 * /api/movies:
 *   get:
 *     tags: [Movies]
 *     summary: List all active movies
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated movie list }
 */
router.get("/", controller.listMovies);

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get a single movie by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Movie details }
 *       404: { description: Not found }
 */
router.get("/:id", controller.getMovieById);

/**
 * @openapi
 * /api/movies:
 *   post:
 *     tags: [Movies]
 *     summary: Create a movie (admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, durationMins, genre, language]
 *             properties:
 *               title:        { type: string, example: Inception }
 *               description:  { type: string }
 *               durationMins: { type: integer, example: 148 }
 *               genre:        { type: array, items: { type: string }, example: [Sci-Fi, Thriller] }
 *               language:     { type: string, example: English }
 *               releaseDate:  { type: string, format: date }
 *               posterUrl:    { type: string }
 *     responses:
 *       201: { description: Movie created }
 *       403: { description: Admins only }
 */
router.post("/", authenticate, authorize("admin"), validate(CreateMovieDto), controller.createMovie);

/**
 * @openapi
 * /api/movies/{id}:
 *   patch:
 *     tags: [Movies]
 *     summary: Update a movie (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Movies]
 *     summary: Soft-delete a movie (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 */
router.patch("/:id",  authenticate, authorize("admin"), controller.updateMovie);
router.delete("/:id", authenticate, authorize("admin"), controller.deleteMovie);

export default router;
