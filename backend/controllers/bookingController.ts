import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Reservation } from '../models/Reservation';
import { Seat } from '../models/Seat';

export const confirmBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reservationId } = req.body;
    const userId = req.user?.userId;

    if (!reservationId) {
      res.status(400).json({ error: 'reservationId is required.' });
      return;
    }

    // 1. Fetch reservation from database
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    // 2. Authorize accessing user
    if (reservation.userId.toString() !== userId) {
      res.status(403).json({ error: 'Access denied. This reservation does not belong to you.' });
      return;
    }

    // 3. Confirm reservation holds active status
if (reservation.status === 'completed') {
      res.status(400).json({ error: 'This reservation is already paid and completed.' });
      return;
    }

    // Defense-in-depth: block confirming if user already has a completed booking
    // for this same event via a different reservation
    const existingCompletedForEvent = await Reservation.findOne({
      eventId: reservation.eventId,
      userId,
      status: 'completed',
      _id: { $ne: reservation._id },
    });

    if (existingCompletedForEvent) {
      await Seat.updateMany(
        {
          eventId: reservation.eventId,
          seatNumber: { $in: reservation.seatNumbers },
          status: 'reserved',
        },
        { $set: { status: 'available' }, $unset: { reservationId: '' } }
      );
      reservation.status = 'expired';
      await reservation.save();

      res.status(409).json({
        error: 'You already have a confirmed booking for this event. This hold has been released.',
      });
      return;
    }
    

    if (reservation.status === 'expired') {
      // Re-assert seat available just in case of stale cache
      await Seat.updateMany(
        {
          eventId: reservation.eventId,
          seatNumber: { $in: reservation.seatNumbers },
          status: 'reserved',
        },
        {
          $set: { status: 'available' },
        }
      );
      res.status(400).json({ error: 'This reservation has already expired. Seats are released.' });
      return;
    }

    // 4. Verify reservation timer threshold
    const now = new Date();
    if (reservation.expiresAt < now) {
      // Perform inline release of reserved seats (clean expiry on confirm attempt)
      await Seat.updateMany(
        {
          eventId: reservation.eventId,
          seatNumber: { $in: reservation.seatNumbers },
          status: 'reserved',
        },
        {
          $set: { status: 'available' },
        }
      );

      reservation.status = 'expired';
      await reservation.save();

      res.status(400).json({ error: 'Reservation expired. Seats have been released back to available.' });
      return;
    }

    // 5. Success Flow: Transition seats from 'reserved' to 'booked' status
    await Seat.updateMany(
      {
        eventId: reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: 'reserved',
      },
      {
        $set: { status: 'booked' },
      }
    );

    // Save history status as completed
    reservation.status = 'completed';
    await reservation.save();

    res.status(200).json({
      message: 'Booking confirmed and ticket successfully processed!',
      booking: {
        id: reservation._id,
        eventId: reservation.eventId,
        seatNumbers: reservation.seatNumbers,
        confirmedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
};
