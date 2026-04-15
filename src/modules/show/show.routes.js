import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import CreateShowDto from "./dto/create-show.dto.js";
import * as controller from "./show.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Shows
 *   description: Movie show schedules
 */

/**
 * @openapi
 * /api/shows:
 *   get:
 *     tags: [Shows]
 *     summary: List upcoming shows
 *     parameters:
 *       - in: query
 *         name: movieId
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string, example: lahore }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2025-05-01" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated show list with movie and theater info }
 */
router.get("/", controller.listShows);

/**
 * @openapi
 * /api/shows/{id}/seats:
 *   get:
 *     tags: [Shows]
 *     summary: Get seat map for a show (login required)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Show info + array of seats with current status }
 *       404: { description: Show not found }
 */
router.get("/:id/seats", authenticate, controller.getShowSeatMap);

/**
 * @openapi
 * /api/shows:
 *   post:
 *     tags: [Shows]
 *     summary: Schedule a new show (admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [movieId, screenId, startTime, pricing]
 *             properties:
 *               movieId:   { type: string }
 *               screenId:  { type: string }
 *               startTime: { type: string, format: date-time, example: "2025-05-01T18:00:00Z" }
 *               pricing:
 *                 type: object
 *                 properties:
 *                   regular: { type: number, example: 500 }
 *                   premium: { type: number, example: 800 }
 *                   vip:     { type: number, example: 1200 }
 *     responses:
 *       201: { description: Show created and seats generated }
 *       409: { description: Screen already booked for this time }
 */
router.post("/", authenticate, authorize("admin"), validate(CreateShowDto), controller.createShow);

/**
 * @openapi
 * /api/shows/{id}/cancel:
 *   patch:
 *     tags: [Shows]
 *     summary: Cancel a show (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Show cancelled, locked seats released }
 */
router.patch("/:id/cancel", authenticate, authorize("admin"), controller.cancelShow);

export default router;
