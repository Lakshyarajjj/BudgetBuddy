import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
  }),
);

app.use(express.json({ limit: "1mb" }));

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to BudgetBuddy API!",
    version: "1.0.0",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected
      ? "BudgetBuddy backend is running"
      : "Database is not connected",
    database: connected ? "Connected" : "Disconnected",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server after database connects
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
      =====================================
           BUDGETBUDDY BACKEND STARTED
      =====================================
           Local: http://localhost:${PORT}
           Health: http://localhost:${PORT}/api/health
           Auth: http://localhost:${PORT}/api/auth
      =====================================
      `);
    });
  } catch (error) {
    console.error("Unable to start BudgetBuddy:", error.message);
    process.exit(1);
  }
}

startServer();
