
// server/dailyScheduler.js
const cron = require("node-cron");
const moment = require("moment");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const Task = require("./models/Task");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReminder(user) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "⏰ Daily Reminder - Be Consistent",
      html: `<p>Hey <strong>${user.name}</strong>, don't forget to complete your tasks today! 💪</p>`,
    });
    console.log(`📧 Reminder sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Reminder failed for ${user.email}:`, err.message);
  }
}

async function sendDailyReport(user, date) {
  try {
    const tasks = await Task.find({ userId: user.email, date });
    const completed = tasks.filter((t) => t.isCompleted).length;
    const total = tasks.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "📊 Daily Task Report - Be Consistent",
      html: `
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Here is your progress for <b>${date}</b>:</p>
        <ul>
          <li>Total Tasks: <strong>${total}</strong></li>
          <li>Completed: <strong>${completed}</strong></li>
          <li>Completion Rate: <strong>${percent}%</strong></li>
        </ul>
        <p>Keep going strong! 🚀</p>
      `,
    });

    console.log(`📊 Report sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Report failed for ${user.email}:`, err.message);
  }
}

// 🔁 Runs every minute
cron.schedule("* * * * *", async () => {
  const now = moment().format("HH:mm");
  const today = moment().format("YYYY-MM-DD");

  try {
    const users = await User.find({
      $or: [{ reminderTime: now }, { reportTime: now }],
    });

    for (const user of users) {
      if (user.reminderTime === now) {
        await sendReminder(user);
      }
      if (user.reportTime === now) {
        await sendDailyReport(user, today);
      }
    }
  } catch (err) {
    console.error("❌ dailyScheduler error:", err);
  }
});

