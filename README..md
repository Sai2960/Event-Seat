# 🎟️ EventSeat — Event Ticket Booking System

> A full-stack MERN application for seamless event seat reservation with atomic concurrency lockouts, real-time seat maps, and booking confirmation.

---

## 📸 Screenshots

### 1. Events Listing
![Events Listing](./screenshot-events.png)

### 2. Seat Selection Map
![Seat Map](./screenshot-seat-map.png)

### 3. Review Reservation & Countdown
![Checkout](./screenshot-checkout.png)

### 4. Booking Confirmed
![Booking Confirmed](./screenshot-confirmed.png)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Hooks, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT-based basic authentication |

---

## 📁 Project Structure

```
eventseat/
├── backend/
│   ├── models/
│   │   ├── Event.js
│   │   ├── Seat.js
│   │   └── Reservation.js
│   ├── routes/
│   │   ├── events.js
│   │   ├── reserve.js
│   │   └── bookings.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.jsx
│   │   │   ├── SeatGrid.jsx
│   │   │   ├── SeatingSummary.jsx
│   │   │   ├── CountdownTimer.jsx
│   │   │   └── BookingConfirmed.jsx
│   │   ├── pages/
│   │   │   ├── EventsPage.jsx
│   │   │   ├── SeatMapPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   └── ConfirmedPage.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 🔧 Backend Setup

```bash
# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# Create a .env file
cp .env.example .env
```

Fill in your `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventseat
JWT_SECRET=your_jwt_secret_key
RESERVATION_EXPIRY_MINUTES=10
```

```bash
# Seed the database with sample events and seats
npm run seed

# Start the backend server
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 💻 Frontend Setup

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Create a .env file
touch .env
```

Fill in your `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
# Start the frontend
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | Get all available events |
| `GET` | `/api/events/:id` | Get single event details |
| `POST` | `/api/reserve` | Reserve seats for 10 minutes |
| `POST` | `/api/bookings` | Confirm booking, mark seats as booked |

### Request & Response Examples

**POST `/api/reserve`**
```json
// Request
{
  "eventId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "seatNumbers": ["A1", "A2"],
  "userId": "K123"
}

// Response
{
  "success": true,
  "reservationId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "expiresAt": "2026-06-18T10:55:00.000Z"
}
```

**POST `/api/bookings`**
```json
// Request
{
  "reservationId": "64f1a2b3c4d5e6f7a8b9c0d2"
}

// Response
{
  "success": true,
  "bookingRef": "8FB955",
  "seats": ["A1", "A2"],
  "confirmedAt": "2026-06-18T10:45:00.000Z"
}
```

---

## 🗄️ Data Models

### Event
```js
{
  name: String,
  dateTime: Date,
  venue: String,
  totalSeats: Number
}
```

### Seat
```js
{
  eventId: ObjectId,          // ref: Event
  seatNumber: String,         // e.g. "A1", "B3"
  status: String              // "available" | "reserved" | "booked"
}
```

### Reservation
```js
{
  userId: String,
  eventId: ObjectId,          // ref: Event
  seatNumbers: [String],
  expiresAt: Date             // Now + 10 minutes
}
```

---

## 🎨 Frontend Flow

```
Events Page  →  Seat Map Page  →  Checkout Page  →  Confirmed Page
(List events)   (Pick seats)      (Review + timer)   (Booking receipt)
```

### Seat Color Legend

| Color | Status |
|-------|--------|
| 🟩 Green border | Available |
| 🟧 Orange border | Reserved (held by another user) |
| 🟥 Red border | Booked (confirmed) |
| 🟦 Blue fill | Your Pick |

---

## 🔒 How Double Booking Is Prevented

Double booking is prevented using **atomic MongoDB operations**. When a user reserves seats, the backend runs a single `updateMany` query that filters only seats with `status: "available"`:

```js
const result = await Seat.updateMany(
  {
    _id: { $in: seatIds },
    status: 'available'          // atomic filter — only update if still available
  },
  { $set: { status: 'reserved' } }
);

// If fewer seats were updated than requested, another user grabbed one
if (result.modifiedCount !== seatIds.length) {
  // Roll back and return conflict error
  await Seat.updateMany(
    { _id: { $in: seatIds }, status: 'reserved' },
    { $set: { status: 'available' } }
  );
  return res.status(409).json({ error: 'One or more seats are no longer available.' });
}
```

This ensures that even if two users select the same seat simultaneously, only one will succeed — the other gets a `409 Conflict` error shown in the UI.

### Reservation Expiry

- Reservations are stored with an `expiresAt` timestamp (10 minutes from creation).
- The **client** shows a countdown timer in the checkout screen.
- The **server** validates `expiresAt > Date.now()` on every `POST /api/bookings` call — so expiry is enforced server-side regardless of client state.
- A background job (or TTL index on MongoDB) cleans up expired reservations and resets seats to `available`.

---

## 🧠 Design Decisions

| Decision | Reason |
|----------|--------|
| Atomic `updateMany` for reservations | Prevents race conditions without needing multi-document transactions |
| 10-minute reservation window | Balances user experience vs seat lock-up time |
| Server-side expiry validation | Client timer is UX only — server is the single source of truth |
| Status field on Seat model | Simple state machine: `available → reserved → booked` |
| JWT for auth | Stateless, easy to verify on each request without session storage |
| Component-based React architecture | Each UI concern (SeatGrid, Timer, Summary) is isolated and reusable |

---

## ✅ Assumptions

- Each event has a fixed 30-seat capacity (5 rows × 6 columns: A–E, 1–6).
- Users must be logged in to reserve or book seats.
- The checkout price is FREE / DEMO — no real payment processing.
- Seat layout is uniform across all events (same grid size).
- Only one active reservation per user per event at a time.

---

## 📦 Environment Variables Summary

| Variable | Location | Description |
|----------|----------|-------------|
| `MONGO_URI` | backend `.env` | MongoDB connection string |
| `JWT_SECRET` | backend `.env` | Secret key for JWT signing |
| `PORT` | backend `.env` | Backend server port (default: 5000) |
| `RESERVATION_EXPIRY_MINUTES` | backend `.env` | Reservation TTL in minutes (default: 10) |
| `REACT_APP_API_URL` | frontend `.env` | Backend base URL for API calls |

---

## 👤 Author

Built as part of the **SortMyScene Full Stack Developer Hiring Assignment**.

---

*EventSeat — Lock in Your Event Seats Spot.*
