// server/dailyReminderService.js
const cron = require('node-cron');
const moment = require('moment');
const nodemailer = require('nodemailer');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Runs every minute to check reminder & report times
cron.schedule('* * * * *', async () => {
  const now = moment().format('HH:mm'); // current time
  const today = moment().format('YYYY-MM-DD');

  try {
    const users = await User.find();

    for (const user of users) {
      if (user.reminderTime === now) {
        await sendReminder(user);
      }

      if (user.reportTime === now) {
        await sendDailyReport(user, today);
      }
    }
  } catch (err) {
    console.error("❌ dailyReminderService error:", err);
  }
});

async function sendReminder(user) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🔔 Task Reminder - Be Consistent',
      html: `
        <p>Hey <strong>${user.name}</strong>,</p>
        <p>Don’t forget to complete your tasks today! ✅</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`⏰ Reminder sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Failed to send reminder to ${user.email}:`, err.message);
  }
}

async function sendDailyReport(user, date) {
  try {
    const tasks = await Task.find({ userId: user.email, date });

    const completed = tasks.filter(t => t.isCompleted).length;
    const total = tasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '📊 Daily Task Report - Be Consistent',
      html: `
        <p><strong>Hello ${user.name},</strong></p>
        <p>Here is your progress for <b>${date}</b>:</p>
        <ul>
          <li>Total Tasks: <strong>${total}</strong></li>
          <li>Completed: <strong>${completed}</strong></li>
          <li>Completion Rate: <strong>${percent}%</strong></li>
        </ul>
        <p>Great job! 🎯 Keep being consistent!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📊 Report sent to ${user.email}`);
  } catch (err) {
    console.error(`❌ Failed to send report to ${user.email}:`, err.message);
  }
}
