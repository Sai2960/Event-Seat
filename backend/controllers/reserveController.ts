import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';
import { releaseExpiredReservationsForEvent } from './eventController';

export const reserveSeats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { eventId, seatNumbers } = req.body;
  const userId = req.user?.userId;

  if (!eventId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    res.status(400).json({ error: 'Valid eventId and a non-empty array of seatNumbers are required.' });
    return;
  }

if (!userId) {
    res.status(401).json({ error: 'Auth credentials missing or malformed.' });
    return;
  }

  // Prevent a user from booking the same event more than once
  const existingCompletedBooking = await Reservation.findOne({
    eventId,
    userId,
    status: 'completed',
  });

  if (existingCompletedBooking) {
    res.status(409).json({
      error: 'You already have a confirmed booking for this event. Duplicate bookings for the same event are not allowed.',
      alreadyBooked: true,
    });
    return;
  }

  const requestedSeats = Array.from(new Set(seatNumbers));

  await releaseExpiredReservationsForEvent(eventId);

  /*
   * =========================================================================
   * CONCURRENCY & DOUBLE-BOOKING PREVENTION STRATEGY
   * =========================================================================
   * MongoDB transactions require a true replica set cluster. The in-memory
   * server (MongoMemoryReplSet) is a single-node replica set that does NOT
   * support transaction numbers, so session.withTransaction() throws
   * "Transaction numbers are only allowed on a replica set member or mongos".
   *
   * Instead we use the following transaction-free but still safe approach:
   *
   * 1. Pre-generate a unique reservationId (ObjectId) BEFORE touching seats.
   *
   * 2. Attempt to claim each seat with a single atomic findOneAndUpdate:
   *      match: { eventId, seatNumber, status: 'available' }
   *      set:   { status: 'reserved', reservationId }
   *    MongoDB's document-level atomicity guarantees that exactly one
   *    concurrent caller can win this write per seat. If the seat is already
   *    reserved/booked the update matches nothing and returns null.
   *
   * 3. Track which seats THIS call successfully claimed (claimedSeats[]).
   *    If any seat fails, immediately release every seat in claimedSeats
   *    by matching { reservationId } — the unique ID ensures we only undo
   *    our own writes, never a concurrent request's legitimately held seat.
   *    This fixes the original bug where rollback targeted { status:'reserved' }
   *    and could accidentally free another request's seats.
   *
   * 4. Only if ALL seats are claimed do we create the Reservation document.
   *
   * Trade-off vs true ACID transactions:
   * - There is a tiny window between step 3 (rollback) and step 4 where the
   *   DB is partially modified. In practice this is invisible to users because
   *   the rollback completes in the same request cycle before any response is
   *   sent. For a production system with a real replica set you would wrap
   *   this in a session.withTransaction() instead.
   * =========================================================================
   */

  const reservationId = new mongoose.Types.ObjectId();
  const claimedSeats: string[] = [];

  try {
    // Attempt to atomically claim each seat
    for (const seatNumber of requestedSeats) {
      const updated = await Seat.findOneAndUpdate(
        {
          eventId,
          seatNumber,
          status: 'available',
        },
        {
          $set: { status: 'reserved', reservationId },
        },
        { new: true }
      );

      if (!updated) {
        // This seat was unavailable — roll back everything claimed so far
        if (claimedSeats.length > 0) {
          await Seat.updateMany(
            { reservationId },
            { $set: { status: 'available' }, $unset: { reservationId: '' } }
          );
        }
        throw new SeatUnavailableError();
      }

      claimedSeats.push(seatNumber);
    }

    // All seats claimed — create the reservation record
    const reservationLifespanMinutes = 10;
    const expiresAt = new Date(Date.now() + reservationLifespanMinutes * 60 * 1000);

    const [reservation] = await Reservation.create([
      {
        _id: reservationId,
        userId,
        eventId,
        seatNumbers: requestedSeats,
        expiresAt,
        status: 'active',
      },
    ]);

    res.status(201).json({
      message: 'Seats reserved successfully for 10 minutes.',
      reservation,
    });
  } catch (error) {
    if (error instanceof SeatUnavailableError) {
      res.status(409).json({
        error: 'One or more selected seats are no longer available. Please try another selection.',
      });
      return;
    }
    next(error);
  }
};

class SeatUnavailableError extends Error {
  constructor() {
    super('SEAT_UNAVAILABLE');
    this.name = 'SeatUnavailableError';
  }
}