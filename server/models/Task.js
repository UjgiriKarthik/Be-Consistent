const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true, // always link task to a user
    },
    title: {
      type: String,
      required: true,
      trim: true, // remove extra spaces
    },
    date: {
      type: Date,
      required: true, // use Date type for proper range queries
    },
    isCompleted: {
      type: Boolean,
      default: false, // ensures it’s always set
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

module.exports = mongoose.model('Task', taskSchema);
