
// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "https://assets.leetcode.com/users/default_avatar.jpg",
    },
    reminderTime: {
      type: String,
      default: "18:00", // HH:mm format
    },
    reportTime: {
      type: String,
      default: "20:00",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

