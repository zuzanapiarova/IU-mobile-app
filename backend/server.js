require('dotenv').config();

const PORT = process.env.PORT || 3000;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// USERS endpoints -------------------------------------------------------------------

// GET /habits - Fetch all users
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

// Get user by username
app.get('/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { name: username },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits - Add a new habit
app.post('/users', async (req, res) => {
  const { name, email } = req.body; // Include userId in the request body
  try {
    const existingUser = await prisma.user.findUnique({
      where: { name: username },
    });

    if (existingUser)
      return res.status(400).json({ error: 'Username already exists' });
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// HABITS endpoints -------------------------------------------------------------------

// GET /habits - Fetch all habits
app.get('/habits', async (req, res) => {
  try {
    const habits = await prisma.habit.findMany({
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
  const { name, frequency, userId } = req.body; // Include userId in the request body
  try {
    const newHabit = await prisma.habit.create({
      data: {
        name,
        frequency,
        userId
      },
    });
    res.status(201).json(newHabit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/:id - Get a habit by ID
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

// // to update habit frequency
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
  const { id } = req.params;
  try {
    // Delete the habit
    await prisma.habit.delete({
      where: { id: parseInt(id) },
    });

    // Optionally, delete related habit completions
    await prisma.habitCompletion.deleteMany({
      where: { habitId: parseInt(id) },
    });

    res.status(204).send(); // No content
  } catch (error) {
    console.error(`Error deleting habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/complete - Mark a habit as completed
app.post('/habits/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const completedHabit = await prisma.habitCompletion.upsert({
      where: {
        habitId_date: {
          habitId: parseInt(id),
          date: today,
        },
      },
      update: { status: true },
      create: { habitId: parseInt(id), date: today, status: true },
    });
    res.json(completedHabit);
  } catch (error) {
    console.error(`Error completing habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /habits/:id/uncomplete - Mark a habit as uncompleted
app.post('/habits/:id/uncomplete', async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const uncompletedHabit = await prisma.habitCompletion.updateMany({
      where: {
        habitId: parseInt(id),
        date: today,
      },
      data: { status: false },
    });
    res.json(uncompletedHabit);
  } catch (error) {
    console.error(`Error uncompleting habit with ID ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /habits/completed - Get completed habits for a specific day
app.get('/habits/completed', async (req, res) => {
  const { date } = req.query;
  const today = date || new Date().toISOString().split('T')[0];
  try {
    const completedHabits = await prisma.habitCompletion.findMany({
      where: {
        date: today,
        status: true,
      },
      select: { habitId: true },
    });
    res.json(completedHabits.map((habit) => habit.habitId));
  } catch (error) {
    console.error(`Error fetching completed habits for date ${today}:`, error);
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
  const { date } = req.query;
  const day = date || new Date().toISOString().split('T')[0];

  try {
    const habitsForDay = await prisma.habitCompletion.findMany({
      where: { date: day },
      orderBy: { status: 'asc' },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            frequency: true,
            current: true,
          },
        },
      },
    });

    const results = habitsForDay.map((row) => ({
      habit_id: row.habit.id,
      name: row.habit.name,
      frequency: row.habit.frequency,
      date: row.date,
      status: row.status,
      timestamp: row.timestamp,
      current: row.habit.current,
    }));

    res.json(results);
  } catch (error) {
    console.error('Error in getHabitsForDay:', error, 'Date:', day);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /initialize-habit-completions - Initialize habit completions for a specific day
app.post('/initialize-habit-completions', async (req, res) => {
  const { date } = req.body;
  const day = date || new Date().toISOString().split('T')[0];

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

    await prisma.habitCompletion.createMany({
      data: habitIds.map((habitId) => ({
        habitId,
        date: day,
        status: false,
      })),
      skipDuplicates: true, // Avoid inserting duplicates
    });

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

// Start the server ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});