import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import reserveRoutes from "./routes/reserveRoutes";
import bookingRoutes from "./routes/bookingRoutes";

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  let mongoUri = process.env.MONGODB_URI;
  let memoryServer: MongoMemoryReplSet | null = null;

  if (!mongoUri) {
    console.warn(
      "⚠️ [DB Warning]: MONGODB_URI environment variable not detected.",
    );
    console.log(
      "⚡ [DB Status]: Initializing high-performance in-memory MongoDB Server for instant preview...",
    );
    try {
      memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      // Wait for the replica set to be fully ready before proceeding
      await memoryServer.waitUntilRunning();
      mongoUri = memoryServer.getUri();
    } catch (dbErr) {
      console.error(
        "❌ [Memory DB Error]: Failed to start memory MongoDB instance. Booting off empty storage.",
        dbErr,
      );
    }
  }

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        // Required for MongoMemoryReplSet — tells the driver to connect
        // directly to this single node rather than attempting replica set
        // discovery, which hangs on the in-memory instance.
        directConnection: true,
      });
      console.log(
        "✅ [Database]: Successfully authenticated and connected to MongoDB.",
      );

      const { runSeed } = await import("./seed");
      await runSeed();
    } catch (connError) {
      console.error(
        "❌ [Database Connection Error]: Critical fault on Mongoose connect:",
        connError,
      );
    }
  }

  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/reserve", reserveRoutes);
  app.use("/api/bookings", bookingRoutes);

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "active",
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      mode: process.env.NODE_ENV || "development",
    });
  });

  const { errorMiddleware } = await import("./middleware/errorMiddleware");
  app.use(errorMiddleware as any);

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "🔧 [Server Mode]: Mounting Vite Middleware for hot Client bundles...",
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(
      "📦 [Server Mode]: Directing to Production Compiled Static distribution...",
    );
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `🚀 [EventSeat Server]: Booted successfully! Access via http://localhost:${PORT}`,
    );
  });

  process.on("SIGTERM", async () => {
    console.log("[Server]: Shutting down elegantly...");
    server.close();
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error(
    "❌ [Fatal Startup Error]: Server failed to initialize:",
    error,
  );
});