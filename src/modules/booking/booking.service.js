import mongoose from "mongoose";
import ApiError from "../../common/utils/api-error.js";
import Show from "../show/show.model.js";
import ShowSeat from "../show/show-seat.model.js";
import Booking from "./booking.model.js";

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ─── Lock Seats ───────────────────────────────────────────────────────────────
// Strategy: atomic updateMany with a status filter.
// MongoDB guarantees each document write is atomic. If two users race for the
// same seat, one updateMany will match it; the other won't — and we detect
// this via modifiedCount. No distributed lock or transaction needed here.

const lockSeats = async (userId, { showId, seatIds }) => {
  // 1. Validate show is bookable
  const show = await Show.findById(showId);
  if (!show) throw ApiError.notfound("Show not found");
  if (show.status !== "scheduled") {
    throw ApiError.badRequest("This show is no longer available for booking");
  }
  if (new Date(show.startTime) <= new Date()) {
    throw ApiError.badRequest("This show has already started");
  }
  // Fast-fail: avoid hitting ShowSeat collection at all when the show is sold out.
  // availableSeats is kept in sync via $inc on every lock/release/booking operation.
  if (show.availableSeats < seatIds.length) {
    throw ApiError.conflict("Not enough available seats for this show");
  }

  // 2. Verify all requested seat IDs actually belong to this show (security guard —
  //    prevents a user from locking seats from a different show by sending arbitrary IDs)
  const validSeats = await ShowSeat.find({ _id: { $in: seatIds }, show: showId }).select("_id");
  if (validSeats.length !== seatIds.length) {
    throw ApiError.badRequest("One or more seat IDs are invalid for this show");
  }

  // 3. Release any previous locks this user holds on this show.
  //    This handles re-selection: user changes their mind and picks different seats.
  await ShowSeat.updateMany(
    { show: showId, lockedBy: userId, status: "locked" },
    { status: "available", lockedBy: null, lockedUntil: null },
  );

  // 4. Atomically attempt to lock all requested seats in a single operation.
  //    The filter { status: "available" } is the race-condition guard —
  //    only documents that are STILL available will be modified.
  const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  const result = await ShowSeat.updateMany(
    { _id: { $in: seatIds }, show: showId, status: "available" },
    { status: "locked", lockedBy: userId, lockedUntil: lockUntil },
  );

  // 5. If we couldn't lock every seat, some were taken between step 3 and step 4.
  //    Roll back any partial locks we did manage to acquire, then reject the request.
  if (result.modifiedCount !== seatIds.length) {
    await ShowSeat.updateMany(
      { _id: { $in: seatIds }, lockedBy: userId, status: "locked" },
      { status: "available", lockedBy: null, lockedUntil: null },
    );
    throw ApiError.conflict(
      "One or more selected seats are no longer available. Please refresh and reselect.",
    );
  }

  // 6. Fetch locked seats to compute the total amount
  const lockedSeats = await ShowSeat.find({ _id: { $in: seatIds } }).select("seatNo type price");
  const totalAmount = lockedSeats.reduce((sum, s) => sum + s.price, 0);

  return {
    showId,
    seats: lockedSeats,
    totalAmount,
    lockedUntil,
  };
};

// ─── Confirm Booking ──────────────────────────────────────────────────────────
// Uses a MongoDB session + transaction to guarantee:
//   - Booking document is created
//   - All ShowSeats are marked booked
//   - Show.availableSeats is decremented
// All three happen atomically or none do.

const confirmBooking = async (userId, { showId, seatIds, paymentId }) => {
  // 1. Verify all seats are locked by this user and the lock hasn't expired
  const seats = await ShowSeat.find({
    _id:         { $in: seatIds },
    show:        showId,
    lockedBy:    userId,
    status:      "locked",
    lockedUntil: { $gt: new Date() },
  });

  if (seats.length !== seatIds.length) {
    throw ApiError.badRequest(
      "Seat locks have expired or are invalid. Please reselect your seats.",
    );
  }

  const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

  // 2. Run in a transaction — all writes succeed or all are rolled back
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const [booking] = await Booking.create(
      [
        {
          user:          userId,
          show:          showId,
          seats:         seatIds,
          totalAmount,
          status:        "confirmed",
          paymentStatus: paymentId ? "paid" : "pending",
          paymentId:     paymentId || null,
          confirmedAt:   new Date(),
        },
      ],
      { session },
    );

    await ShowSeat.updateMany(
      { _id: { $in: seatIds } },
      { status: "booked", booking: booking._id, lockedBy: null, lockedUntil: null },
      { session },
    );

    await Show.findByIdAndUpdate(
      showId,
      { $inc: { availableSeats: -seatIds.length } },
      { session },
    );

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Cancel Booking ───────────────────────────────────────────────────────────
const cancelBooking = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notfound("Booking not found");

  // Ownership check — a user cannot cancel someone else's booking
  if (booking.user.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not have permission to cancel this booking");
  }
  if (["cancelled", "refunded"].includes(booking.status)) {
    throw ApiError.badRequest(`Booking is already ${booking.status}`);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    booking.status        = "cancelled";
    booking.paymentStatus = booking.paymentId ? "refunded" : booking.paymentStatus;
    booking.cancelledAt   = new Date();
    await booking.save({ session });

    // Release seats back to available
    await ShowSeat.updateMany(
      { _id: { $in: booking.seats } },
      { status: "available", booking: null, lockedBy: null, lockedUntil: null },
      { session },
    );

    // Restore available seat count on the show
    await Show.findByIdAndUpdate(
      booking.show,
      { $inc: { availableSeats: booking.seats.length } },
      { session },
    );

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Get My Bookings ──────────────────────────────────────────────────────────
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

// ─── Get Booking By ID ────────────────────────────────────────────────────────
const getBookingById = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path:     "show",
      populate: [
        { path: "movie",  select: "title language durationMins" },
        { path: "screen", select: "name", populate: { path: "theater", select: "name city address" } },
      ],
    })
    .populate("seats", "seatNo row col type price status");

  if (!booking) throw ApiError.notfound("Booking not found");

  if (booking.user.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not have permission to view this booking");
  }

  return booking;
};

export { lockSeats, confirmBooking, cancelBooking, getMyBookings, getBookingById };
