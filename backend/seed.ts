import mongoose from 'mongoose';
import { Event } from './models/Event';
import { Seat } from './models/Seat';

export const runSeed = async (): Promise<void> => {
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      console.log('[Seeding]: Database already contains event data. Skipping auto-seed.');
      return;
    }

    console.log('[Seeding]: No events detected. Initializing database seeding...');

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
      {
        name: 'Jazz Under the Stars',
        dateTime: new Date('2026-10-10T19:00:00-05:00'),
        venue: 'Riverside Garden Theatre, Chicago',
        totalSeats: 30,
      },
      {
        name: 'Electronic Beats Summit',
        dateTime: new Date('2026-11-05T21:00:00-08:00'),
        venue: 'Neon Pavilion, Los Angeles',
        totalSeats: 30,
      },
      {
        name: 'Classical Nights with the Metro Orchestra',
        dateTime: new Date('2026-12-18T18:00:00-05:00'),
        venue: 'Grand Hall, New York',
        totalSeats: 30,
      },
      {
  name: 'Bollywood Beats Night',
  dateTime: new Date('2026-08-23T19:30:00+05:30'),
  venue: 'NSCI Dome, Worli, Mumbai',
  totalSeats: 30,
},
{
  name: 'NH7 Weekender Mumbai',
  dateTime: new Date('2026-10-03T17:00:00+05:30'),
  venue: 'Mahalaxmi Racecourse, Mumbai',
  totalSeats: 30,
},
{
  name: 'A.R. Rahman Live in Concert',
  dateTime: new Date('2026-12-06T18:30:00+05:30'),
  venue: 'Jio World Garden, BKC, Mumbai',
  totalSeats: 30,
},

    ];

    const createdEvents = await Event.insertMany(mockEvents);

    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 6;
    const seatsToInsert: any[] = [];

    for (const event of createdEvents) {
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          const seatNumber = `${row}${num}`;

          let status: 'available' | 'reserved' | 'booked' = 'available';
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
    console.log(`[Seeding]: Successfully seeded ${createdEvents.length} events and ${seatsToInsert.length} seats maps!`);
  } catch (error) {
    console.error('[Seeding Error]: Error running database seeding:', error);
  }
};