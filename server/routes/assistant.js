// File: server/routes/assistant.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
require('dotenv').config();

const OpenAI = require('openai');

// ----- OpenAI client (primary) -----
// Make sure OPENAI_API_KEY is set in your .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Optional: pick model via env or fallback
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

router.post('/', async (req, res) => {
  const { email, query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // ----- compute last 7-day window as Date objects -----
    const end = new Date(); // now
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    // ----- fetch tasks (Date range) -----
    const tasks = await Task.find({
      userId: email,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // ----- build summary of tasks ----- (safe date formatting)
    const taskSummary =
      tasks.length > 0
        ? tasks
            .map(
              (t) =>
                `- [${t.date.toISOString().slice(0, 10)}] ${t.title} — ${
                  t.isCompleted ? '✅ Completed' : '❌ Not completed'
                }`
            )
            .join('\n')
        : 'No tasks found.';

    // ----- prompt to the assistant -----
    const prompt = `
You are a friendly productivity assistant helping users reflect on their habits.

Here is the user's task history for the last 7 days:

${taskSummary}

User question:
"${query}"
`;

    // ----- Call OpenAI chat completion -----
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful productivity assistant.' },
        { role: 'user', content: prompt },
      ],
      // optional: tune tokens/timeouts if needed
      max_tokens: 700,
    });

    const answer =
      completion?.choices?.[0]?.message?.content?.trim() ||
      'No response from the assistant.';

    res.json({ answer });
  } catch (err) {
    console.error('🛑 Assistant route error:', err);
    res.status(500).json({ message: 'Assistant error', error: err.message });
  }
});

module.exports = router;
