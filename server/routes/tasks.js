const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

// ✅ Get monthly completion percentages
router.get('/monthly/:month/:userId', async (req, res) => {
  const { month, userId } = req.params;

  try {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const tasks = await Task.find({
      userId,
      date: { $gte: start, $lt: end },
    });

    const progressMap = {};

    tasks.forEach((task) => {
      const day = task.date.toISOString().split('T')[0];
      if (!progressMap[day]) {
        progressMap[day] = { total: 0, completed: 0 };
      }
      progressMap[day].total++;
      if (task.isCompleted) progressMap[day].completed++;
    });

    const result = {};
    for (const [date, { total, completed }] of Object.entries(progressMap)) {
      result[date] = total > 0 ? Math.round((completed / total) * 100) : null;
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching monthly data:', err);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// ✅ Get monthly summary with streaks
router.get('/summary/:month/:userId', async (req, res) => {
  const { month, userId } = req.params;

  try {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const tasks = await Task.find({
      userId,
      date: { $gte: start, $lt: end },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isCompleted).length;

    // Build progress map
    const progressMap = {};
    tasks.forEach((task) => {
      const day = task.date.toISOString().split('T')[0];
      if (!progressMap[day]) {
        progressMap[day] = { total: 0, completed: 0 };
      }
      progressMap[day].total++;
      if (task.isCompleted) progressMap[day].completed++;
    });

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const completedDates = [];

    const sortedDates = Object.keys(progressMap).sort();
    for (const date of sortedDates) {
      const { total, completed } = progressMap[date];
      if (total > 0 && completed === total) {
        completedDates.push(date);
        tempStreak++;
        currentStreak = tempStreak;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
        currentStreak = 0;
      }
    }

    res.json({
      totalTasks,
      completedTasks,
      daysCompleted: completedDates.length,
      currentStreak,
      bestStreak,
      completedDates,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

// ✅ Get daily tasks
router.get('/:date/:userId', async (req, res) => {
  const { date, userId } = req.params;

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    res.status(500).json({ error: 'Failed to fetch daily tasks' });
  }
});

// ✅ Add task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(400).json({ error: 'Failed to add task' });
  }
});

// ✅ Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ error: 'Failed to update task' });
  }
});

// ✅ Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ✅ Copy incomplete tasks
router.post('/copy-incomplete', async (req, res) => {
  const { fromDate, toDate, userId } = req.body;

  try {
    const fromStart = new Date(fromDate);
    fromStart.setHours(0, 0, 0, 0);

    const fromEnd = new Date(fromDate);
    fromEnd.setHours(23, 59, 59, 999);

    const incompleteTasks = await Task.find({
      userId,
      date: { $gte: fromStart, $lte: fromEnd },
      isCompleted: false,
    });

    if (!incompleteTasks.length) {
      return res.json({ message: 'No incomplete tasks found to copy', count: 0 });
    }

    const copiedTasks = await Task.insertMany(
      incompleteTasks.map((task) => ({
        userId,
        title: task.title,
        date: new Date(toDate),
        isCompleted: false,
      }))
    );

    res.json({ message: 'Tasks copied successfully', count: copiedTasks.length });
  } catch (error) {
    console.error('Error copying tasks:', error);
    res.status(500).json({ error: 'Failed to copy tasks' });
  }
});

// ✅ Get incomplete tasks (for import dropdown)
router.get('/incomplete/:date/:userId', async (req, res) => {
  const { date, userId } = req.params;

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      userId,
      date: { $gte: start, $lte: end },
      isCompleted: false,
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching incomplete tasks:', error);
    res.status(500).json({ error: 'Failed to fetch incomplete tasks' });
  }
});

module.exports = router;
