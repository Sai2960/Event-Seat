import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReservation extends Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatNumbers: string[];
  expiresAt: Date;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    seatNumbers: {
      type: [String],
      required: [true, 'Seat numbers are required'],
      validate: {
        validator: function (v: any) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Reservation must select at least 1 seat',
      },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date and time are required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add an index on expiresAt for fast queries regarding cleanup/expiration
ReservationSchema.index({ expiresAt: 1 });

export const Reservation = mongoose.models.Reservation || mongoose.model<any>('Reservation', ReservationSchema);
