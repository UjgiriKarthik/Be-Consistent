// File: server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');
const emailRoutes = require('./routes/email');
const userRoutes = require('./routes/users');
const verifyRoutes = require('./routes/verify');
const scheduleEmails = require('./cron/scheduleEmails');
require('./dailyReminderService');
require('./dailyScheduler');

const app = express();

app.use(cors());
app.use(express.json());

const assistantRoute = require('./routes/assistant');
app.use('/api/assistant', assistantRoute);

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/users', userRoutes);     // Login/Register
app.use('/api/verify', verifyRoutes);  // OTP

// Root route
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Schedule email jobs
scheduleEmails();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
