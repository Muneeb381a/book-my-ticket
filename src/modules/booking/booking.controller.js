import ApiResponse from "../../common/utils/api-response.js";
import * as bookingService from "./booking.service.js";

const lockSeats = async (req, res) => {
  const result = await bookingService.lockSeats(req.user.id, req.body);
  ApiResponse.ok(res, "Seats locked. Complete your booking within 10 minutes.", result);
};

const confirmBooking = async (req, res) => {
  const booking = await bookingService.confirmBooking(req.user.id, req.body);
  ApiResponse.created(res, "Booking confirmed", booking);
};

const cancelBooking = async (req, res) => {
  const booking = await bookingService.cancelBooking(req.user.id, req.params.id);
  ApiResponse.ok(res, "Booking cancelled", booking);
};

const getMyBookings = async (req, res) => {
  const { page, limit } = req.query;
  const result = await bookingService.getMyBookings(req.user.id, { page, limit });
  ApiResponse.ok(res, "Bookings fetched", result);
};

const getBookingById = async (req, res) => {
  const booking = await bookingService.getBookingById(req.user.id, req.params.id);
  ApiResponse.ok(res, "Booking fetched", booking);
};

export { lockSeats, confirmBooking, cancelBooking, getMyBookings, getBookingById };
