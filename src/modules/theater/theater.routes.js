import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateTheaterDto from "./dto/create-theater.dto.js";
import CreateScreenDto from "./dto/create-screen.dto.js";
import * as controller from "./theater.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Theaters
 *   description: Theaters and screens
 */

/**
 * @openapi
 * /api/theaters:
 *   get:
 *     tags: [Theaters]
 *     summary: List theaters, optionally filtered by city
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string, example: karachi }
 *     responses:
 *       200: { description: List of theaters }
 */
router.get("/", controller.listTheaters);

/**
 * @openapi
 * /api/theaters/{id}:
 *   get:
 *     tags: [Theaters]
 *     summary: Get theater details with its screens
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Theater and its screens }
 *       404: { description: Not found }
 */
router.get("/:id", controller.getTheaterById);

/**
 * @openapi
 * /api/theaters/{theaterId}/screens/{screenId}:
 *   get:
 *     tags: [Theaters]
 *     summary: Get a specific screen with its seat map
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: screenId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Screen with full seat map }
 */
router.get("/:theaterId/screens/:screenId", controller.getScreenById);

/**
 * @openapi
 * /api/theaters:
 *   post:
 *     tags: [Theaters]
 *     summary: Create a theater (admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, city, address]
 *             properties:
 *               name:    { type: string, example: Cineplex Gold }
 *               city:    { type: string, example: karachi }
 *               address: { type: string, example: Main Boulevard, Gulshan }
 *     responses:
 *       201: { description: Theater created }
 */
router.post("/", authenticate, authorize("admin"), validate(CreateTheaterDto), controller.createTheater);

/**
 * @openapi
 * /api/theaters/{theaterId}/screens:
 *   post:
 *     tags: [Theaters]
 *     summary: Add a screen to a theater (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: theaterId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, seatMap]
 *             properties:
 *               name: { type: string, example: Screen 1 }
 *               seatMap:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     row:      { type: string, example: A }
 *                     col:      { type: integer, example: 1 }
 *                     type:     { type: string, enum: [regular, premium, vip] }
 *                     isActive: { type: boolean }
 *     responses:
 *       201: { description: Screen created }
 */
router.post("/:theaterId/screens", authenticate, authorize("admin"), validate(CreateScreenDto), controller.createScreen);

export default router;
