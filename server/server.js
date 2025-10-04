// File: server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const taskRoutes = require("./routes/tasks");
const emailRoutes = require("./routes/email");
const userRoutes = require("./routes/users");
const verifyRoutes = require("./routes/verify");
const assistantRoute = require("./routes/assistant");
const scheduleEmails = require("./cron/scheduleEmails");

// Optional background jobs (safe on local, but disable on Vercel)
if (process.env.NODE_ENV !== "production") {
  require("./dailyReminderService");
  require("./dailyScheduler");
}

const app = express();

// ✅ CORS setup — allow your frontend domain
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000", // your frontend domain
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/assistant", assistantRoute);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 Be Consistent backend is running successfully!");
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Run cron jobs only on local (Vercel does not persist background jobs)
if (process.env.NODE_ENV !== "production") {
  scheduleEmails();
}

// ✅ Use dynamic port for deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
