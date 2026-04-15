import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import LockSeatsDto from "./dto/lock-seats.dto.js";
import ConfirmBookingDto from "./dto/confirm-booking.dto.js";
import * as controller from "./booking.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * tags:
 *   name: Bookings
 *   description: Seat locking and booking management
 */

/**
 * @openapi
 * /api/bookings/lock:
 *   post:
 *     tags: [Bookings]
 *     summary: Lock seats for 10 minutes
 *     description: >
 *       Atomically locks the requested seats. If any seat is already taken,
 *       the entire request fails and no seats are locked (no partial locks).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId, seatIds]
 *             properties:
 *               showId:  { type: string }
 *               seatIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["663f...", "663g..."]
 *     responses:
 *       200: { description: Seats locked. Contains totalAmount and lockedUntil. }
 *       409: { description: One or more seats already taken }
 */
router.post("/lock", validate(LockSeatsDto), controller.lockSeats);

/**
 * @openapi
 * /api/bookings/confirm:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm booking after payment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [showId, seatIds]
 *             properties:
 *               showId:    { type: string }
 *               seatIds:   { type: array, items: { type: string } }
 *               paymentId: { type: string, description: "Payment gateway reference (optional)" }
 *     responses:
 *       201: { description: Booking confirmed with bookingRef }
 *       400: { description: Locks expired — reselect seats }
 */
router.post("/confirm", validate(ConfirmBookingDto), controller.confirmBooking);

/**
 * @openapi
 * /api/bookings/my:
 *   get:
 *     tags: [Bookings]
 *     summary: Get logged-in user's bookings
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated booking history }
 */
router.get("/my", controller.getMyBookings);

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get full booking details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking with show, movie, theater, and seat info }
 *       403: { description: Not your booking }
 *       404: { description: Not found }
 */
router.get("/:id", controller.getBookingById);

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cancelled. Seats released back to available. }
 *       403: { description: Not your booking }
 */
router.patch("/:id/cancel", controller.cancelBooking);

export default router;
