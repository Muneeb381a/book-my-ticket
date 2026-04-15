import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import validate from "../../common/middleware/validate.middleware.js";
import LockSeatsDto from "./dto/lock-seats.dto.js";
import ConfirmBookingDto from "./dto/confirm-booking.dto.js";
import * as controller from "./booking.controller.js";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post(  "/lock",          validate(LockSeatsDto),    controller.lockSeats);
router.post(  "/confirm",       validate(ConfirmBookingDto), controller.confirmBooking);
router.get(   "/my",            controller.getMyBookings);
router.get(   "/:id",           controller.getBookingById);
router.patch( "/:id/cancel",    controller.cancelBooking);

export default router;
