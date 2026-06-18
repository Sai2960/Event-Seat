# EventSeat — Full-Stack Event Ticket Booking System

EventSeat is a simplified full-stack MERN application focusing on real-time interactive seat holds, live countdown checkout sessions, and rigid preventative measures against concurrent double-booking.

---

## 🎨 Design Concept & Visuals
- **Inter & JetBrains Mono Fonts**: Paired custom neo-grotesque typography for optimal reading grids.
- **Interactive Seating Auditorium Map**: Dynamic color-coded seat matrices (Green = Available, Amber = Under Hold/Reserved, Red = Sold Out/Booked).
- **Graceful Live Timers**: Interactive `mm:ss` countdown clocks that automatically handle timeout expiration.
- **Official Ticket Resumes Receipts**: A post-booking voucher summary complete with virtual security barcoding.

---

## 🚀 Concurrency & Double-Booking Prevention

### Atomic Conditional Updates + Abort Loop Rollback (Chosen Strategy)
To completely prevent race conditions where two simultaneous transactions try to book the exact same seat, we implement **Approach B: Atomic Conditional Updates with Abort Loop Rollback**. 

#### **How It Works**:
1. When a user requests to hold seats, we start an atomic loop that targets each requested seat individually.
2. In each iteration, we use Mongoose's `findOneAndUpdate` with a query filter requiring the status to be strictly `"available"`:
   ```javascript
   Seat.findOneAndUpdate(
     { eventId, seatNumber, status: 'available' },
     { $set: { status: 'reserved' } }
   )
   ```
3. Since **MongoDB performs single-document modifications atomically**, if two users concurrently submit requests for the exact same seat, only the first request to lock the row index will succeed and set its status to `"reserved"`. The second request fails to find the seat in `"available"` status and receives `null`.
4. If **any single seat in the batch fails to reserve**, we halt immediately. To satisfy transactional integrity (all-or-nothing), we trigger a **Rollback** by reverting only the seat numbers that *this specific request* successfully locked back to `"available"`.
5. This strategy is **100% safe, requires no database replicas (needed for standard multi-document sessions), behaves lock-free, and handles high-frequency concurrent traffic flawlessly**.

---

## 📚 Directory Layout Structure

The monorepo organizes frontend and backend into two clear sub-folders:

```
/backend
  /models (User.ts, Event.ts, Seat.ts, Reservation.ts)
  /routes (authRoutes.ts, eventRoutes.ts, reserveRoutes.ts, bookingRoutes.ts)
  /controllers (authController.ts, eventController.ts, reserveController.ts, bookingController.ts)
  /middleware (authMiddleware.ts, errorMiddleware.ts)
  server.ts            <- Primary Express controller & Vite dev-server orchestrator
  seed.ts              <- TypeScript helper database seed
  seed.js              <- Standalone ES6 seed script
  .env.example
  package.json

/frontend
  /src/components (Navbar.tsx, EventCard.tsx, CountdownTimer.tsx)
  /src/pages (Login.tsx, Signup.tsx, EventsList.tsx, EventDetail.tsx, ReservationCheckout.tsx)
  /src/context (AuthContext.tsx)
  /src/api (api.ts)
  package.json
```

---

## 🛠️ How to Launch & Test Locally

First, clone this workspace.

### **1. Single-Command Launch (Recommended)**
The workspace root `package.json` compiles and bundles the system orchestrator in a unified fashion.
```bash
# Install dependencies across directories
npm install

# Start the full-stack development environment (runs backend and mounts Vite)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live app!

### **2. Running Backend (Standalone)**
Configure your database connectivity variables in `/backend/.env`. If `MONGODB_URI` is omitted, the backend spins up an **automatic, in-memory MongoDB Server (MongoMemoryServer)** so you can test it immediately without configuration:
```bash
cd backend
npm install

# Run stand-alone database seeding (optional - server auto-seeds on start if empty)
npm run seed

# Run standalone backend server
npm start
```

### **3. Running Frontend (Standalone)**
The frontend compiles statically. To launch or test client files in isolation:
```bash
cd frontend
npm install

# Build static bundles
npm run build
```

---

## ⚙️ Environment Variables (.env)
Create a `.env` in the root workspace (or copy `/backend/.env.example`):
```env
MONGODB_URI="mongodb+srv://..."  # Leave blank to leverage in-memory database
JWT_SECRET="your_jwt_signing_secret"
PORT=3000
```

---

## 💡 System Design Assumptions
1. **Holding Lifespan**: Reservations last exactly **10 minutes** from the creation timestamp.
2. **Auditorium Scheme**: Events default to small, intuitive 5 rows by 6 columns seat matrix (Row A-E, Col 1-6; 30 seats per event) to make testing quick and screen-fitted.
3. **No Payment Gate Needed**: Seat bookings represent mock passes. Confirming your reservation transitions standard placeholders into a `"booked"` stage without credit card entries.
4. **Clean Expirations (Check-on-Read)**: Instead of costly cron timers, seats under expired reservations are auto-released on-demand when any client requests event seats or attempts to complete bookings.

---

## 🏗️ Future Scope & Production Refinements
- **Relational Databases (SQL)**: Migrate high-transaction seat booking rows to relational systems like PostgreSQL using strict row-level locking (`SELECT ... FOR UPDATE`) to prevent table-level locks.
- **WebSocket Synchronization**: Implement WebSockets or Event-Streams so that seat reservations made by User A immediately change colors on User B's screen in real-time, reducing reservation failures.
- **Background Cleanup Workers**: Integrate Redis Queue (BullMQ) or standard system cron runners to sweep and release expired seat holds, keeping database indices clean and free of stale rows even if the app receives no read traffic.
- **Payment Hooks**: Integrate secure Stripe standard sessions webhook listeners.
