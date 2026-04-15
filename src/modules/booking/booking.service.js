import mongoose from "mongoose";
import ApiError from "../../common/utils/api-error.js";
import Show from "../show/show.model.js";
import ShowSeat from "../show/show-seat.model.js";
import Booking from "./booking.model.js";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 min

const lockSeats = async (userId, { showId, seatIds }) => {
  const show = await Show.findById(showId);
  if (!show) throw ApiError.notfound("Show not found");
  if (show.status !== "scheduled") throw ApiError.badRequest("Show is not available for booking");
  if (new Date(show.startTime) <= new Date()) throw ApiError.badRequest("Show has already started");

  // fast fail before hitting ShowSeat collection
  if (show.availableSeats < seatIds.length) throw ApiError.conflict("Not enough seats available");

  // make sure all seat IDs actually belong to this show
  const validSeats = await ShowSeat.find({ _id: { $in: seatIds }, show: showId }).select("_id");
  if (validSeats.length !== seatIds.length) throw ApiError.badRequest("Invalid seat selection");

  // release any previous locks this user holds on this show (re-selection support)
  await ShowSeat.updateMany(
    { show: showId, lockedBy: userId, status: "locked" },
    { status: "available", lockedBy: null, lockedUntil: null },
  );

  // atomic lock — only seats still "available" will be updated
  const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  const result = await ShowSeat.updateMany(
    { _id: { $in: seatIds }, show: showId, status: "available" },
    { status: "locked", lockedBy: userId, lockedUntil: lockUntil },
  );

  // someone grabbed a seat between our check and the update — roll back
  if (result.modifiedCount !== seatIds.length) {
    await ShowSeat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId, status: "locked" },
      { status: "available", lockedBy: null, lockedUntil: null },
    );
    throw ApiError.conflict("Some seats were just taken. Please refresh and reselect.");
  }

  const lockedSeats = await ShowSeat.find({ _id: { $in: seatIds } }).select("seatNo type price");
  const totalAmount = lockedSeats.reduce((sum, s) => sum + s.price, 0);

  return { showId, seats: lockedSeats, totalAmount, lockedUntil };
};

const confirmBooking = async (userId, { showId, seatIds, paymentId }) => {
  // verify seats are still locked by this user and not expired
  const seats = await ShowSeat.find({
    _id: { $in: seatIds },
    show: showId,
    lockedBy: userId,
    status: "locked",
    lockedUntil: { $gt: new Date() },
  });

  if (seats.length !== seatIds.length) {
    throw ApiError.badRequest("Seat locks expired. Please reselect your seats.");
  }

  const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

  // transaction: booking + seat update + counter decrement — all or nothing
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const [booking] = await Booking.create(
      [{
        user: userId,
        show: showId,
        seats: seatIds,
        totalAmount,
        status: "confirmed",
        paymentStatus: paymentId ? "paid" : "pending",
        paymentId: paymentId || null,
        confirmedAt: new Date(),
      }],
      { session },
    );

    await ShowSeat.updateMany(
      { _id: { $in: seatIds } },
      { status: "booked", booking: booking._id, lockedBy: null, lockedUntil: null },
      { session },
    );

    await Show.findByIdAndUpdate(showId, { $inc: { availableSeats: -seatIds.length } }, { session });

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const cancelBooking = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notfound("Booking not found");
  if (booking.user.toString() !== userId.toString()) throw ApiError.forbidden("Access denied");
  if (["cancelled", "refunded"].includes(booking.status)) {
    throw ApiError.badRequest(`Booking is already ${booking.status}`);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    booking.status = "cancelled";
    booking.paymentStatus = booking.paymentId ? "refunded" : booking.paymentStatus;
    booking.cancelledAt = new Date();
    await booking.save({ session });

    // free up the seats
    await ShowSeat.updateMany(
      { _id: { $in: booking.seats } },
      { status: "available", booking: null, lockedBy: null, lockedUntil: null },
      { session },
    );

    await Show.findByIdAndUpdate(booking.show, { $inc: { availableSeats: booking.seats.length } }, { session });

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getMyBookings = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find({ user: userId })
      .populate("show", "startTime status")
      .populate("seats", "seatNo type price")
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Booking.countDocuments({ user: userId }),
  ]);

  return { bookings, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
};

const getBookingById = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: "show",
      populate: [
        { path: "movie", select: "title language durationMins" },
        { path: "screen", select: "name", populate: { path: "theater", select: "name city address" } },
      ],
    })
    .populate("seats", "seatNo row col type price status");

  if (!booking) throw ApiError.notfound("Booking not found");
  if (booking.user.toString() !== userId.toString()) throw ApiError.forbidden("Access denied");

  return booking;
};

export { lockSeats, confirmBooking, cancelBooking, getMyBookings, getBookingById };
