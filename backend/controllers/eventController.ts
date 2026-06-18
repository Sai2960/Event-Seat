import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Seat } from '../models/Seat';
import { Reservation } from '../models/Reservation';

/**
 * Check-on-read worker that detects and releases expired reservations for a given event,
 * returning those seats back to the "available" status atomically.
 */
export const releaseExpiredReservationsForEvent = async (eventId: string): Promise<void> => {
  const now = new Date();

  // Find all active reservations for this event that have exceeded their reservation lifespan
  const expiredReservations = await Reservation.find({
    eventId,
    expiresAt: { $lt: now },
    status: 'active',
  });

  if (expiredReservations.length === 0) {
    return;
  }

  // Iterate and process each expired reservation
  for (const reservation of expiredReservations) {
    // Atomically release the specific seats associated with this expired reservation
    await Seat.updateMany(
      {
        eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: 'reserved', // Ensure we only touch seats that are still in 'reserved' status
      },
      {
        $set: { status: 'available' },
      }
    );

    // Update status to 'expired' to persist transaction history
    reservation.status = 'expired';
    await reservation.save();
  }

  console.log(`[Expiry Trigger]: Auto-released ${expiredReservations.length} expired reservations for Event ${eventId}`);
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // 1. Run check-on-read cleanup of expired seats
    await releaseExpiredReservationsForEvent(id);

    // 2. Fetch the updated seat distribution map
    const seats = await Seat.find({ eventId: id }).sort({ seatNumber: 1 });

    res.status(200).json({
      event,
      seats,
    });
  } catch (error) {
    next(error);
  }
};
