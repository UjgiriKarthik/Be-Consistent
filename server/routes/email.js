// File: server/routes/email.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS, // from .env (App Password)
  },
});

// Send email route
router.post('/send', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await transporter.sendMail({
      from: `Be-Consistent <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,  // plain text version
      html,  // optional HTML version
    });

    res.json({ message: '✅ Email sent successfully' });
  } catch (error) {
    console.error('❌ Email failed:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = router;
