import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISeat extends Document {
  eventId: Types.ObjectId;
  seatNumber: string;
  status: 'available' | 'reserved' | 'booked';
  reservationId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema: Schema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
      required: true,
    },
    // Tracks which Reservation document currently holds this seat (if any).
    // This lets us release/confirm EXACTLY the seats tied to one specific
    // reservation attempt, instead of guessing based on status alone --
    // this is what closes the rollback-ambiguity bug in the old controller.
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate seats for the same event
SeatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

export const Seat = mongoose.models.Seat || mongoose.model<ISeat>('Seat', SeatSchema);