// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// helper to mask sensitive fields in an object (shallow) to avoid logging raw passwords/tokens
function maskSensitive(obj = {}) {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = { ...obj };
  ['password', 'token', 'accessToken', 'refreshToken'].forEach((k) => {
    if (masked[k] !== undefined) masked[k] = '[REDACTED]';
  });
  return masked;
}

/**
 * Request logging middleware
 * Logs method, path, status and duration.
 * If LOG_LEVEL=debug this also logs masked request body and query params.
 */
app.use((req, res, next) => {
  const start = Date.now();

  // When response finishes, log summary
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      userId: req.query?.userId || req.body?.userId || null,
    };

    logger.info(`HTTP ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`, meta);

    // debug-level: more details
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Request details', {
        body: maskSensitive(req.body),
        query: req.query,
        params: req.params,
        headers: {
          // Avoid logging all headers; include a few useful ones (if present)
          'user-agent': req.headers['user-agent'],
          referer: req.headers.referer || null,
        },
      });
    }
  });

  next();
});

// USERS endpoints -------------------------------------------------------------------

// Fetch all users
app.get('/users', async (req, res) => {
  logger.info('GET /users - fetching all users');
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    logger.info('GET /users - success', { count: users.length });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users due to internal server error.', { error: error?.message, stack: error?.stack });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SIGNUP
app.post('/users', async (req, res) => {
  const { name, email /* password intentionally not logged */ } = req.body;
  logger.info('POST /users - signup attempt', { email, name });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn('Signup error - user already exists', { email });
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    logger.info('User created successfully', { userId: newUser.id, email });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    logger.error('Signup failed due to internal server error.', { error: error?.message, stack: error?.stack, email });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email } = req.body;
  logger.info('POST /login - login attempt', { email });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      logger.warn('Login failed - wrong password', { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('Login successful', { userId: user.id, email });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    logger.error('Login failed due to internal server error.', { error: error?.message, stack: error?.stack, email });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SAFE UPDATE USER
app.put('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);
  const updates = req.body;
  logger.info('PUT /users/:id - update attempt', { userId, updates: process.env.LOG_LEVEL === 'debug' ? maskSensitive(updates) : undefined });

  try {
    const allowedFields = [
      'name',
      'email',
      'password',
      'themePreference',
      'language',
      'dataProcessingAgreed',
      'notificationsEnabled',
      'successLimit',
      'failureLimit',
      'notificationTime',
    ];

    const safeUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'password') {
          safeUpdates.password = await bcrypt.hash(updates.password, 10);
          logger.debug('Password provided, hashed for update', { userId });
        } else if (key === 'successLimit' || key === 'failureLimit') {
          const value = Number(updates[key]);
          if (isNaN(value) || value < 0 || value > 100) {
            logger.debug('Update failed - limits out of scope 0-100', { userId, field: key, value: updates[key] });
            return res.status(400).json({ error: `${key} must be a number between 0 and 100` });
          }
          safeUpdates[key] = value;
        } else {
          safeUpdates[key] = updates[key];
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: safeUpdates,
    });

    logger.info('User updated successfully', { userId, updatedKeys: Object.keys(safeUpdates) });

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    logger.error(`Internal error updating user with ID ${userId}:`, { error: error?.message, stack: error?.stack, userId });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// HABITS endpoints -------------------------------------------------------------------------

// GET /habits - Fetch all habits for a specific user
app.get('/habits', async (req, res) => {
  const { userId } = req.query;
  logger.info('GET /habits - fetch habits request', { userId });

  if (!userId) {
    logger.warn('Error fetching habits - no user provided.');
    return res.status(400).json({ error: 'User is required to be logged in' });
  }

  try {
    const habits = await prisma.habit.findMany({
      where: { userId: parseInt(userId), current: true },
      orderBy: { createdAt: 'desc' },
    });
    logger.info('GET /habits - success', { userId, count: habits.length });
    res.json(habits);
  } catch (error) {
    logger.error('Internal error fetching habits.', { error: error?.message, stack: error?.stack, userId });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits - Add a new habit
app.post('/habits', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { name, frequency, userId } = req.body;
  logger.info('POST /habits - create habit attempt', { name, frequency, userId });

  if (!name || !frequency || !userId) {
    logger.warn('Error adding habit - missing required fields', { namePresent: !!name, frequencyPresent: !!frequency, userIdPresent: !!userId });
    return res.status(400).json({ error: 'Name, frequency, and userId are required' });
  }

  try {
    const newHabit = await prisma.habit.create({
      data: {
        name,
        frequency,
        userId,
      },
    });

    logger.info('Habit created', { habitId: newHabit.id, userId });

    // add a corresponding entry to the habitCompletions table for today's date
    await prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId: newHabit.id,
          date: today,
        },
      },
      update: {}, // No update needed, just ensure the record exists
      create: {
        habitId: newHabit.id,
        date: today,
        status: false,
      },
    });

    logger.debug('Habit completion initialized for today (if missing)', { habitId: newHabit.id, date: today });
    res.status(201).json(newHabit);
  } catch (error) {
    if (error?.code === 'P2002') {
      logger.warn('Duplicate entry error while creating habit', { error: error?.message, code: error?.code });
      res.status(400).json({ error: 'Duplicate habit entry' });
    } else {
      logger.error('Error creating habit:', { error: error?.message, stack: error?.stack, name, userId });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// GET /habits/:id - Get a habit by ID
app.get('/habits/:id', async (req, res) => {
  const { id } = req.params;
  logger.info('GET /habits/:id - fetch habit', { habitId: id });

  try {
    const habit = await prisma.habit.findUnique({
      where: { id: parseInt(id) },
    });
    if (!habit) {
      logger.warn('Habit not found', { habitId: id });
      return res.status(404).json({ error: 'Habit not found' });
    }
    logger.info('Habit fetched', { habitId: id });
    res.json(habit);
  } catch (error) {
    logger.error(`Error fetching habit with ID ${id}:`, { error: error?.message, stack: error?.stack, habitId: id });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /habits/:id - Update a habit
app.put('/habits/:id', async (req, res) => {
  const { id } = req.params;
  const { name, frequency } = req.body;
  logger.info('PUT /habits/:id - update attempt', { habitId: id, name, frequency });

  try {
    const updatedHabit = await prisma.habit.update({
      where: { id: parseInt(id) },
      data: { name, frequency },
    });
    logger.info('Habit updated', { habitId: id });
    res.json(updatedHabit);
  } catch (error) {
    logger.error(`Error updating habit with ID ${id}:`, { error: error?.message, stack: error?.stack, habitId: id });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /habits/:id - Delete a habit
app.delete('/habits/:id', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params;
  const habitId = parseInt(id);
  logger.info('DELETE /habits/:id - delete attempt', { habitId });

  if (isNaN(habitId)) {
    logger.warn('Invalid habit ID provided to delete', { habitIdRaw: id });
    return res.status(400).json({ error: 'Invalid habit ID' });
  }

  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) {
      logger.warn('Delete failed - habit not found', { habitId });
      return res.status(404).json({ error: 'Habit not found' });
    }

    // delete related habit completions for today's date
    await prisma.habitCompletion.deleteMany({
      where: {
        habitId: habitId,
        date: today,
      },
    });
    logger.debug('Deleted habit completions for today (if any)', { habitId, date: today });

    // Check if habit has any completions at all
    const habitCompletionsCount = await prisma.habitCompletion.count({
      where: { habitId: habitId },
    });

    if (habitCompletionsCount > 0) {
      // If there are habit completions, update the habit to set `current` to false
      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { current: false },
      });
      logger.info('Habit marked as not current (has completions)', { habitId });
      res.json(updatedHabit); // return updated habit
    } else {
      await prisma.habit.delete({
        where: {
          id: habitId,
        },
      });
      logger.info('Habit deleted permanently (no completions found)', { habitId });
      res.status(200).json({ message: `Deleted habit from habits as it was not used by any habitCompletion.` });
    }
  } catch (error) {
    logger.error(`Error deleting habit with ID ${id}:`, { error: error?.message, stack: error?.stack, habitId: id });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/complete - Mark a habit as completed
app.post('/habits/:id/complete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params; // Habit ID
  const { date } = req.body; // Optional date from the request body
  const day = date || today;
  logger.info('POST /habits/:id/complete - completing habit', { habitId: id, day });

  try {
    // Check if a record exists for the given habitId and date
    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: parseInt(id),
          date: day,
        },
      },
    });

    let completedHabit;

    if (existingCompletion) {
      // If the record exists, update its status to true
      completedHabit = await prisma.habitCompletion.update({
        where: {
          habitId_date: {
            habitId: parseInt(id),
            date: day,
          },
        },
        data: {
          status: true, // Set status to true (completed)
          timestamp: new Date().toISOString(), // Update the timestamp to the current time
        },
      });
      logger.info('Habit completion updated to true', { habitId: id, date: day });
    } else {
      // If the record does not exist, create a new one with status = true
      completedHabit = await prisma.habitCompletion.create({
        data: {
          habitId: parseInt(id),
          date: day,
          status: true, // Set status to true (completed)
          timestamp: new Date().toISOString(), // Set the timestamp to the current time
        },
      });
      logger.info('Habit completion created with status true', { habitId: id, date: day, completionId: completedHabit.id });
    }

    res.json(completedHabit); // Return the updated or created habit completion
  } catch (error) {
    logger.error(`Error completing habit with ID ${id}:`, { error: error?.message, stack: error?.stack, habitId: id, date: day });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/uncomplete - Mark a habit as uncompleted
app.post('/habits/:id/uncomplete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params;
  const { date } = req.body;
  const day = date || today;
  logger.info('POST /habits/:id/uncomplete - uncompleting habit', { habitId: id, day });

  try {
    // Update the habit completion for the specified day
    const uncompletedHabit = await prisma.habitCompletion.update({
      where: {
        habitId_date: {
          habitId: parseInt(id),
          date: day,
        },
      },
      data: { status: false },
    });

    logger.info('Habit completion updated to false', { habitId: id, date: day });
    res.json(uncompletedHabit); // Return the updated habit completion
  } catch (error) {
    logger.error(`Error uncompleting habit with ID ${id}:`, { error: error?.message, stack: error?.stack, habitId: id, date: day });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/completed - Get completed habits for a specific day
app.get('/habits/completed', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { date } = req.query;
  const day = date || today;
  logger.info('GET /habits/completed - fetching completed habits', { date: day });

  try {
    const completedHabits = await prisma.habitCompletion.findMany({
      where: {
        date: day,
        status: true,
      },
      select: { habitId: true },
    });
    logger.info('Completed habits fetched', { date: day, count: completedHabits.length });
    res.json(completedHabits.map((habit) => habit.habitId));
  } catch (error) {
    logger.error(`Error fetching completed habits for date ${day}:`, { error: error?.message, stack: error?.stack, date: day });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get completion percentage for a specific day
app.get('/completion-percentage', async (req, res) => {
  const { date } = req.query;
  logger.info('GET /completion-percentage - request received', { date });

  try {
    const totalHabits = await prisma.habit.count();
    if (totalHabits === 0) {
      logger.info('No habits found when calculating completion percentage', { date });
      return res.json({ date, percentage: 0 }); // No habits for the day
    }

    // Count completed habits for the given day
    const completedCount = await prisma.habitCompletion.count({
      where: {
        date: date,
        status: true, // Assuming `status` is a boolean for completion
      },
    });

    const percentage = (completedCount / totalHabits) * 100;
    logger.info('Completion percentage calculated', { date, totalHabits, completedCount, percentage });
    res.json({ date, percentage });
  } catch (error) {
    logger.error('Error fetching completion percentage:', { error: error?.message, stack: error?.stack, date });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits-for-day - Retrieve habits completed for a specific day
app.get('/habits-for-day', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { userId, allowDeleted, date } = req.query;
  const day = date || today;
  const includeDeleted = allowDeleted === 'true'; // Convert allowDeleted to a boolean (default to false if undefined)

  logger.info('GET /habits-for-day - request received', { userId, day, includeDeleted });

  if (!userId) {
    logger.warn('GET /habits-for-day - missing userId');
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const habitsForDay = await prisma.habitCompletion.findMany({
      where: { 
        habit: { userId: parseInt(userId) },
        date: day,
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            frequency: true,
            current: includeDeleted,
          },
        },
      },
    });

    // Map the results to include habit details
    const results = habitsForDay.map((row) => ({
      id: row.id,
      habit_id: row.habit?.id || null,
      name: row.habit?.name || 'Unknown Habit',
      frequency: row.habit?.frequency || 'Unknown',
      date: row.date,
      status: row.status,
      timestamp: row.timestamp,
      current: row.habit?.current || false,
    }));

    logger.info(`GET /habits-for-day - ${day} -  success`, { userId, day, count: results.length });
    res.json(results);
  } catch (error) {
    logger.error('Error in getHabitsForDay:', { error: error?.message, stack: error?.stack, userId, date: day });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /initialize-habit-completions - Initialize habit completions for a specific day
app.post('/initialize-habit-completions', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { date } = req.body;
  const day = date || today;
  logger.info('POST /initialize-habit-completions - request', { day });

  try {
    // Get all current habits
    const currentHabits = await prisma.habit.findMany({
      where: { current: true },
      select: { id: true },
    });

    if (currentHabits.length === 0) {
      logger.info('No current habits to initialize', { day });
      return res.status(200).json({ message: 'No current habits to initialize.' });
    }

    // Insert habits into habit_completions if they don't already exist for the day
    const habitIds = currentHabits.map((habit) => habit.id);

    try {
      await prisma.habitCompletion.createMany({
        data: habitIds.map((id) => ({
          habitId: id,
          date: day,
          status: false,
        })),
      });
      logger.info('Initialize habit completions completed - success ', { day, createdForCount: habitIds.length });
    } catch (err) {
      if (err?.code === 'P2002') {
        logger.warn('⚠️ Duplicate habit completions skipped', { day });
      } else {
        throw err;
      }
    }

    res.status(200).json({ message: `Initialized habit completions for ${day}` });
  } catch (error) {
    logger.error('Error initializing habit completions:', { error: error?.message, stack: error?.stack, day });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits-completions/most-recent-date - Get the most recent date from habit completions
app.get('/habits-completions/most-recent-date', async (req, res) => {
  logger.info('GET /habits-completions/most-recent-date - request');
  try {
    const mostRecent = await prisma.habitCompletion.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const maxDate = mostRecent?.date || null;
    logger.info('Most recent habit completion date fetched', { maxDate });
    res.json({ maxDate });
  } catch (error) {
    logger.error('Error fetching most recent date:', { error: error?.message, stack: error?.stack });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/streaks - Calculate the longest streak for a specific habit
app.get('/habit-streaks', async (req, res) => {
  const { userId, habitId, startsAfterDate } = req.query;
  logger.info('GET /habit-streaks - request', { userId, habitId, startsAfterDate });

  if (!userId || !habitId) {
    logger.warn('GET /habit-streaks - missing userId or habitId', { userId, habitId });
    return res.status(400).json({ error: 'userId and habitId are required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = startsAfterDate || '1970-01-01'; // Default to the earliest possible date
  try {
    // Fetch habit completions for the habit from today backward
    const completions = await prisma.habitCompletion.findMany({
      where: {
        habitId: parseInt(habitId),
        habit: { userId: parseInt(userId) },
        date: { gte: startDate, lte: today },
      },
      orderBy: { date: 'desc' }, // Sort by date in descending order
    });

    let longestStreak = 0;
    let currentStreak = 0;

    // Calculate the streak
    for (const completion of completions) {
      if (completion.status === true) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0; // Reset streak if a day is missed
      }
    }

    logger.info('Habit streak calculated', { habitId, userId, longestStreak });
    res.json({ habitId: parseInt(habitId), streak: longestStreak });
  } catch (error) {
    logger.error('Error calculating longest streak:', { error: error?.message, stack: error?.stack, habitId, userId });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server ------------------------------------------------------------

// checks whether this file is being run directly as node server.js or in  test environment
if (require.main === module) {
  const host = process.env.HOST || '0.0.0.0'; // bind address
  logger.info(`Server is starting on port ${PORT} (host: ${host})`);
  app.listen(PORT, host, () => {
    logger.info(`Server is running on port ${PORT} (host: ${host})`);
  });
}

// export the app for imports during testing
module.exports = { app, prisma };