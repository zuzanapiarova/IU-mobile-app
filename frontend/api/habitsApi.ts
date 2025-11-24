import { OfflineManager } from '../app/init';
import * as SQLite from 'expo-sqlite';
import { Habit, HabitCompletion, HabitWithCompletion } from '@/constants/interfaces';

let db: SQLite.SQLiteDatabase;

async function getDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
  }
  return db;
}

// Fetch all habits for the logged-in user
export async function getAllHabits(userId: number): Promise<Habit[]> {
  const db = await getDB();
  return await db.getAllAsync<Habit>('SELECT * FROM habits WHERE userId = ?;', [userId]);
}

// Add a new habit
export async function addHabit(name: string, frequency: string = 'daily', userId: number): Promise<Habit> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO habits (name, frequency, userId, current, synced) VALUES (?, ?, ?, 1, 0);`,
    [name, frequency, userId]
  );
  const inserted = await db.getAllAsync<Habit>(`SELECT * FROM habits WHERE rowid = last_insert_rowid();`);
  return inserted[0];
}

// Get a habit by ID
export async function getHabitById(id: number): Promise<Habit | null> {
  const db = await getDB();
  const habit = await db.getAllAsync<Habit>(`SELECT * FROM habits WHERE id = ?;`, [id]);
  return habit[0] ?? null;
}

/// todo: change - just change to current = false, and remove from habit completions 
// Delete a habit
export async function deleteHabit(id: number): Promise<void> {
  const db = await getDB();
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync(`DELETE FROM habits WHERE id = ?;`, [id]);
  await db.runAsync(`DELETE FROM habit_completions WHERE habitId = ? AND date = ?;`, [id, today]);
}

// Update a habit
export async function updateHabit(id: number, name: string, frequency: string): Promise<Habit | null> {
  const db = await getDB();
  await db.runAsync(`UPDATE habits SET name = ?, frequency = ?, synced = 0 WHERE id = ?;`, [name, frequency, id]);
  const updated = await db.getAllAsync<Habit>(`SELECT * FROM habits WHERE id = ?;`, [id]);
  return updated[0] ?? null;
}

// Complete a habit
export async function completeHabit(habitId: number, date?: string): Promise<void> {
  const db = await getDB();
  const day = date || new Date().toISOString().split('T')[0];
  await db.runAsync(
    `INSERT OR REPLACE INTO habit_completions (habitId, date, status, synced)
     VALUES (?, ?, 1, 0);`,
    [habitId, day]
  );
}

// Uncomplete a habit
export async function uncompleteHabit(habitId: number, date?: string): Promise<void> {
  const db = await getDB();
  const day = date || new Date().toISOString().split('T')[0];
  await db.runAsync(
    `INSERT OR REPLACE INTO habit_completions (habitId, date, status, synced)
     VALUES (?, ?, 0, 0);`,
    [habitId, day]
  );
}

// Get completed habit IDs for a specific day
export async function getCompletedHabitsForDay(date?: string): Promise<number[]> {
  const db = await getDB();
  const day = date || new Date().toISOString().split('T')[0];
  const results = await db.getAllAsync<{ habitId: number }>(
    `SELECT habitId FROM habit_completions WHERE date = ? AND status = 1;`,
    [day]
  );
  return results.map(r => r.habitId);
}

// Get completion percentage for a specific day
export async function getCompletionPercentageForDay(date: string): Promise<{ date: string; percentage: number }> {
  const db = await getDB();
  const totalRes = await db.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM habit_completions WHERE date = ?;`,
    [date]
  );
  const completedRes = await db.getAllAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM habit_completions WHERE date = ? AND status = 1;`,
    [date]
  );
  const total = totalRes[0]?.count ?? 0;
  const completed = completedRes[0]?.count ?? 0;
  return { date, percentage: total ? (completed / total) * 100 : 0 };
}

// Get habits with completion status for a specific day
export async function getHabitsForDay(userId: number, allowDeleted: boolean, date?: string): Promise<HabitWithCompletion[]> {
    const db = await getDB();
    const day = date || new Date().toISOString().split('T')[0];
  
    // Fetch habits
    const habits = await db.getAllAsync<Habit>(
      `SELECT * FROM habits WHERE userId = ?;`,
      [userId]
    );
  
    // Fetch completions for the day
    const completions = await db.getAllAsync<HabitCompletion>(
      `SELECT * FROM habit_completions WHERE date = ?;`,
      [day]
    );
  
    // Merge habits + completions into HabitWithCompletion
    const habitsWithCompletion: HabitWithCompletion[] = habits.map(habit => {
      const completion = completions.find(c => c.habit_id === habit.id);
  
      return {
        id: completion?.id ?? 0, // completion ID, 0 if no completion exists
        habit_id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        date: day,
        status: completion?.status ?? 0,
        timestamp: completion?.date ?? '', // Use completion date as timestamp if available
        current: !!habit.current,
      };
    });
  
    return habitsWithCompletion;
  }

// Initialize habit completions for a specific day
export async function initializeHabitCompletionsForDay(date?: string): Promise<void> {
  const db = await getDB();
  const day = date || new Date().toISOString().split('T')[0];
  const habits = await db.getAllAsync<Habit>(`SELECT * FROM habits;`);

  for (const habit of habits) {
    await db.runAsync(
      `INSERT OR IGNORE INTO habit_completions (habitId, date, status, synced) VALUES (?, ?, 0, 0);`,
      [habit.id, day]
    );
  }
}

// Get the most recent completion date
export async function getMostRecentDate(): Promise<string | null> {
  const db = await getDB();
  const result = await db.getAllAsync<{ maxDate: string }>(`SELECT MAX(date) as maxDate FROM habit_completions;`);
  return result[0]?.maxDate ?? null;
}

// Get habit streak since a certain date
export async function getHabitStreak(userId: number, habitId: number, startsAfterDate: string): Promise<{ habitId: number; streak: number }> {
  const db = await getDB();
  const completions = await db.getAllAsync<HabitCompletion>(
    `SELECT * FROM habit_completions WHERE habitId = ? AND date >= ? ORDER BY date ASC;`,
    [habitId, startsAfterDate]
  );

  let streak = 0;
  let maxStreak = 0;
  for (const c of completions) {
    if (c.status === 1) streak++;
    else streak = 0;
    if (streak > maxStreak) maxStreak = streak;
  }
  return { habitId, streak: maxStreak };
}