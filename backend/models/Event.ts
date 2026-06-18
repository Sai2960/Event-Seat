import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  dateTime: Date;
  venue: string;
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time are required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats configuration is required'],
      min: [1, 'Event must have at least 1 seat'],
    },
  },
  {
    timestamps: true,
  }
);

export const Event = mongoose.models.Event || mongoose.model<any>('Event', EventSchema);
