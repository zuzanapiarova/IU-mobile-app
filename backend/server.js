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

// GET /habits - Fetch all habits
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

// POST /habits - Add a new habit
app.post('/users', async (req, res) => {
  const { name, email } = req.body; // Include userId in the request body
  try {
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});