const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// USERS endpoints -------------------------------------------------------------------

// Fetch all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SIGNUP
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Received signup body:', req.body);

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Received login body:', req.body);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// SAFE UPDATE USER
app.put('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);
  const updates = req.body;
  console.log('updates');
  console.log(updates);

  try {
    const allowedFields = [
      'name',
      'email',
      'password',
      'themePreference',
      'language',
      'dataProcessingAgreed',
      'notificationsEnabled',
      'successLimit', // Add successLimit
      'failureLimit', // Add failureLimit
      'notificationTime'
    ];

    const safeUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === 'password') {
          safeUpdates.password = await bcrypt.hash(updates.password, 10);
        } else if (key === 'successLimit' || key === 'failureLimit') {
          // Validate successLimit and failureLimit
          const value = Number(updates[key]);
          if (isNaN(value) || value < 0 || value > 100) {
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

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (err) {
    console.error(`Error updating user with ID ${userId}:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// HABITS endpoints -------------------------------------------------------------------------

// GET /habits - Fetch all habits for a specific user
app.get('/habits', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User is required to be logged in' });
  }

  try {
    const habits = await prisma.habit.findMany({
      where: { userId: parseInt(userId), current: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits - Add a new habit
app.post('/habits', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { name, frequency, userId } = req.body;
  if (!name || !frequency || !userId)
    return res.status(400).json({ error: 'Name, frequency, and userId are required' });
  
  try {
    // Add the new habit to the habits table
    const newHabit = await prisma.habit.create({
      data: {
        name,
        frequency,
        userId
      },
    });
    // Add a corresponding entry to the habitCompletions table for today's date
    // upsert method will insert a new record if it doesn’t exist or update the existing record if it does
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
    res.status(201).json(newHabit);
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('Duplicate entry error:', error);
      res.status(400).json({ error: 'Duplicate habit entry' });
    } else {
      console.error('Error creating habit:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// GET /habits/:id - Get a habit by ID - TESTED
app.get('/habits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const habit = await prisma.habit.findUnique({
      where: { id: parseInt(id) },
    });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(habit);
  } catch (error) {
    console.error(`Error fetching habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /habits/:id - Update a habit
app.put('/habits/:id', async (req, res) => {
  const { id } = req.params;
  const { name, frequency } = req.body;
  try {
    const updatedHabit = await prisma.habit.update({
      where: { id: parseInt(id) },
      data: { name, frequency },
    });
    res.json(updatedHabit);
  } catch (error) {
    console.error(`Error updating habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// to update habit name 
// app.put('/habits/:id/name', async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;
//   try {
//     const updatedHabit = await prisma.habit.update({
//       where: { id: parseInt(id) },
//       data: { name },
//     });
//     res.json(updatedHabit);
//   } catch (error) {
//     console.error('Error updating habit name:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// to update habit frequency
// app.put('/habits/:id/frequency', async (req, res) => {
//   const { id } = req.params;
//   const { frequency } = req.body;
//   try {
//     const updatedHabit = await prisma.habit.update({
//       where: { id: parseInt(id) },
//       data: { frequency },
//     });
//     res.json(updatedHabit);
//   } catch (error) {
//     console.error('Error updating habit frequency:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// DELETE /habits/:id - Delete a habit
app.delete('/habits/:id', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params;
  const habitId = parseInt(id);
  if (isNaN(habitId))
    return res.status(400).json({ error: 'Invalid habit ID' });
  try {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit)
      return res.status(404).json({ error: 'Habit not found' });
    // delete related habit completions for todays date
    await prisma.habitCompletion.deleteMany({
      where: {
        habitId: habitId,
        date: today
      },
    });
    // "Delete" the habit - set it as not current, since its id was used and is referenced in past habit completions 
    // but if no record in habitCompletions references this habit, delete it completely - we will not need it 
    const habitCompletionsCount = await prisma.habitCompletion.count({
      where: { habitId: habitId },
    });

    if (habitCompletionsCount > 0) {
      // If there are habit completions, update the habit to set `current` to false
      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { current: false },
      });
      res.json(updatedHabit); // return updated habit 
    }
    else
    {
      await prisma.habit.delete({
        where: {
          id: habitId
        },
      });
      res.status(200).json({ message: `Deleted habit from habits as it was not used by any habitCompletion.` });
    }
  } catch (error) {
    console.error(`Error deleting habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/complete - Mark a habit as completed
// we receive habit id(not completion id) and date, and we have to cehck that habit id on that date in habitCompletions - add record with status = true or change status = true if tehre is record on that day with tht habit 
app.post('/habits/:id/complete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params; // Habit ID
  const { date } = req.body; // Optional date from the request body
  const day = date || today; // Use the provided date or default to today

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
    }

    res.json(completedHabit); // Return the updated or created habit completion
  } catch (error) {
    console.error(`Error completing habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/uncomplete - Mark a habit as uncompleted
app.post('/habits/:id/uncomplete', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { id } = req.params;
  const { date } = req.body;
  const day = date || today;

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

    res.json(uncompletedHabit); // Return the updated habit completion
  } catch (error) {
    console.error(`Error uncompleting habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/completed - Get completed habits for a specific day
app.get('/habits/completed', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { date } = req.query;
  const day = date || today;
  try {
    const completedHabits = await prisma.habitCompletion.findMany({
      where: {
        date: day,
        status: true,
      },
      select: { habitId: true },
    });
    res.json(completedHabits.map((habit) => habit.habitId));
  } catch (error) {
    console.error(`Error fetching completed habits for date ${day}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get completion percentage for a specific day
app.get('/completion-percentage', async (req, res) => {
  const { date } = req.query;

  try {
    const totalHabits = await prisma.habit.count();
    if (totalHabits === 0)
      return res.json({ date, percentage: 0 }); // No habits for the day

    // Count completed habits for the given day
    const completedCount = await prisma.habitCompletion.count({
      where: {
        date: date,
        status: true, // Assuming `status` is a boolean for completion
      },
    });

    const percentage = (completedCount / totalHabits) * 100;
    res.json({ date, percentage });
  } catch (error) {
    console.error('Error fetching completion percentage:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits-for-day - Retrieve habits completed for a specific day
app.get('/habits-for-day', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { userId, allowDeleted, date } = req.query;
  const day = date || today;
  const includeDeleted = allowDeleted === 'true';  // Convert allowDeleted to a boolean (default to false if undefined)

  if (!userId)
    return res.status(400).json({ error: 'User ID is required' });

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

    res.json(results);
  } catch (error) {
    console.error('Error in getHabitsForDay:', error, 'Date:', day);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /initialize-habit-completions - Initialize habit completions for a specific day
app.post('/initialize-habit-completions', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { date } = req.body;
  const day = date || today;
  try {
    // Get all current habits
    const currentHabits = await prisma.habit.findMany({
      where: { current: true },
      select: { id: true },
    });

    if (currentHabits.length === 0) {
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
    } catch (err) {
      if (err.code === 'P2002') console.log('⚠️ Duplicate habit completions skipped');
      else throw err;
    }

    res.status(200).json({ message: `Initialized habit completions for ${day}` });
  } catch (error) {
    console.error('Error initializing habit completions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits-completions/most-recent-date - Get the most recent date from habit completions
app.get('/habits-completions/most-recent-date', async (req, res) => {
  try {
    const mostRecent = await prisma.habitCompletion.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const maxDate = mostRecent?.date || null;
    res.json({ maxDate });
  } catch (error) {
    console.error('Error fetching most recent date:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/streaks - Calculate the longest streak for a specific habit
app.get('/habit-streaks', async (req, res) => {
  const { userId, habitId, startsAfterDate } = req.query;

  if (!userId || !habitId) {
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

    res.json({ habitId: parseInt(habitId), streak: longestStreak });
  } catch (error) {
    console.error('Error calculating longest streak:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});