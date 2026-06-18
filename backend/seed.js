import mongoose from 'mongoose';

// Minimal Mongoose definitions for seed.js to run standalone on node
const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateTime: { type: Date, required: true },
  venue: { type: String, required: true },
  totalSeats: { type: Number, required: true },
}, { timestamps: true });

const SeatSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seatNumber: { type: String, required: true },
  status: { type: String, enum: ['available', 'reserved', 'booked'], default: 'available' },
}, { timestamps: true });

SeatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Seat = mongoose.models.Seat || mongoose.model('Seat', SeatSchema);

const runSeed = async () => {
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      console.log('Database already has events. Skipping seed.');
      return;
    }

    console.log('No events found. Seeding initial event data...');

    const mockEvents = [
      {
        name: 'Synthesizer Concert 2026',
        dateTime: new Date('2026-08-15T20:00:00-07:00'),
        venue: 'Grand Metropol Arena, Seattle',
        totalSeats: 30,
      },
      {
        name: 'The Great Indie Rock Festival',
        dateTime: new Date('2026-09-22T18:30:00-07:00'),
        venue: 'Parklands Amphitheatre, Boston',
        totalSeats: 30,
      },
    ];

    const createdEvents = await Event.insertMany(mockEvents);

    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 6;
    const seatsToInsert = [];

    for (const event of createdEvents) {
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          const seatNumber = `${row}${num}`;
          let status = 'available';
          const random = Math.random();
          if (random < 0.15) {
            status = 'booked';
          } else if (random < 0.22) {
            status = 'reserved';
          }

          seatsToInsert.push({
            eventId: event._id,
            seatNumber,
            status,
          });
        }
      }
    }

    await Seat.insertMany(seatsToInsert);
    console.log(`Successfully seeded ${createdEvents.length} events and ${seatsToInsert.length} seats!`);
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventseat';
console.log('Seeding using URI:', uri.startsWith('mongodb+srv://') ? 'private atlas URI' : uri);

mongoose.connect(uri)
  .then(async () => {
    await runSeed();
    await mongoose.disconnect();
    console.log('Disconnected from Database.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding process connection failed:', err);
    process.exit(1);
  });
