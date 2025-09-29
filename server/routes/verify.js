// server/routes/verify.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

let OTPs = global.OTPs || new Map();
global.OTPs = OTPs;

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS, // from .env
  },
});

// 🔐 Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  if (OTPs.has(email)) {
    return res.status(429).json({ message: 'OTP already sent. Please wait before requesting again.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  OTPs.set(email, otp);

  console.log(`✅ OTP for ${email}: ${otp}`);
  setTimeout(() => OTPs.delete(email), 5 * 60 * 1000); // Expire in 5 mins

  try {
    await transporter.sendMail({
      from: `Be-Consistent <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Be-Consistent Signup',
      text: `Your OTP is: ${otp}\n\nIt will expire in 5 minutes.`,
    });

    res.json({ message: 'OTP sent to email' }); // 🚫 No OTP in response
  } catch (err) {
    console.error('❌ Email failed:', err);
    OTPs.delete(email);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// 🔐 Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = OTPs.get(email);

  console.log(`📩 Verifying OTP for ${email}`);
  console.log(`👉 Incoming: ${otp}, Stored: ${storedOtp}`);

  if (storedOtp && parseInt(otp.trim()) === storedOtp) {
    OTPs.delete(email);
    return res.json({ verified: true, message: 'OTP verified' });
  }

  return res.status(400).json({ verified: false, message: 'OTP verification failed' });
});

module.exports = router;
