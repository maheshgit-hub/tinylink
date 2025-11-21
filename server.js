import express from "express";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

// Load environment variables
dotenv.config();

// Connect to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    version: "1.0",
    uptime: process.uptime(),
  });
});

// Start server
app.listen(port, () => {
  console.log(`TinyLink server running on http://localhost:${port}`);
});
