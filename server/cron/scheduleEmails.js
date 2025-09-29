// File: server/cron/scheduleEmails.js
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Task = require("../models/Task");
const User = require("../models/User");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sendEmail(to, subject, text) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

// Convert "HH:MM" → cron expression ("MM HH * * *")
function timeToCron(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return `${minute} ${hour} * * *`;
}

// Greeting helper
function getGreeting(hour) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// ✅ Schedule all jobs
module.exports = function scheduleEmails() {
  try {
    // Daily reminders
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      const users = await User.find({ reminderTime: currentTime });
      for (let user of users) {
        try {
          const hour = parseInt(user.reminderTime.split(":")[0], 10);
          await sendEmail(
            user.email,
            "Daily Task Reminder",
            `Good ${getGreeting(hour)} ${user.name},\n\nDon’t forget to check your Be Consistent tasks today!`
          );
          console.log(`✅ Reminder sent to ${user.email} at ${currentTime}`);
        } catch (err) {
          console.error(`❌ Reminder failed for ${user.email}:`, err);
        }
      }
    });

    // Daily reports
    cron.schedule("* * * * *", async () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const today = now.toISOString().slice(0, 10);

      const users = await User.find({ reportTime: currentTime });
      for (let user of users) {
        try {
          const tasks = await Task.find({ userId: user._id, date: today });
          const completed = tasks.filter((t) => t.isCompleted).length;
          const total = tasks.length;
          const percent = total ? Math.round((completed / total) * 100) : 0;

          await sendEmail(
            user.email,
            "Daily Summary",
            `Hello ${user.name},\n\nToday you completed ${percent}% of your tasks (${completed}/${total}). Keep it up!`
          );
          console.log(`✅ Report sent to ${user.email} at ${currentTime}`);
        } catch (err) {
          console.error(`❌ Report failed for ${user.email}:`, err);
        }
      }
    });

    // Monthly report (1st day of each month at 06:00)
    cron.schedule("0 6 1 * *", async () => {
      try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const yearMonth = lastMonth.toISOString().slice(0, 7);

        const users = await User.find();
        for (let user of users) {
          const tasks = await Task.find({
            userId: user._id,
            date: { $regex: `^${yearMonth}` },
          });

          const completedDays = new Set(
            tasks.filter((t) => t.isCompleted).map((t) => t.date)
          ).size;

          await sendEmail(
            user.email,
            "Monthly Report",
            `Hi ${user.name},\n\nLast month you had ${completedDays} days with completed tasks. Keep going strong!`
          );
        }
        console.log("✅ Monthly reports sent");
      } catch (err) {
        console.error("❌ Monthly report failed:", err);
      }
    });

    console.log("📅 Email schedules initialized");
  } catch (err) {
    console.error("❌ Failed to initialize schedules:", err);
  }
};
