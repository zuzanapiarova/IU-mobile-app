import { db, initializeDatabase } from './db';

// Add a new habit
export async function addHabit(name: string, frequency = 'daily') {
    await initializeDatabase();
    await db.runAsync('INSERT INTO habits (name, frequency) VALUES (?, ?)', [name, frequency]);
}

export async function getAllHabits(): Promise<any[]> {
    await initializeDatabase();
    const results = await db.getAllAsync('SELECT * FROM habits ORDER BY created_at DESC');
    return results;
}

export async function getHabitById(id: number): Promise<any> {
    await initializeDatabase();
    const result = await db.getFirstAsync('SELECT * FROM habits WHERE id = ?', [id]);
    return result;
}

// deletes habit from habits table
// also deletes it from teh habit_completions table just for today
// its completion for past dates will stay for logging and history
export async function deleteHabit(id: number): Promise<void> {
    await initializeDatabase();
    const today = new Date().toISOString().split('T')[0];
    console.log(" deleting habit id: " + id + " for day " + today + " from hc and id " + id + " from h");
    await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM habit_completions WHERE habit_id = ? AND date = ?', [id, today]);
}

export async function updateHabit(id: number, name: string, frequency: string): Promise<void> {
    await initializeDatabase();
    await db.runAsync(
        'UPDATE habits SET name = ?, frequency = ? WHERE id = ?',
        [name, frequency, id]
    );
}

export async function completeHabit(habitId: number, date?: string): Promise<void> {
    await initializeDatabase();
    const day = (date || new Date().toISOString().split('T')[0]).trim();
    console.log(" completing habit id: " + habitId + " day " + day);
    console.log('Date param is:', JSON.stringify(day));
    console.log(typeof(day));

    await db.runAsync(
        `INSERT INTO habit_completions (habit_id, date, status)
         VALUES (?, ?, 1)
         ON CONFLICT(habit_id, date) DO UPDATE SET status = 1`,
        [habitId, day]
    );
}

export async function uncompleteHabit(habitId: number, date?: string): Promise<void> {
    await initializeDatabase();
    const day = date || new Date().toISOString().split('T')[0];
    console.log(" uncompleting habit id: " + habitId + " day " + day);

    await db.runAsync(
        `UPDATE habit_completions
         SET status = 0, timestamp = (datetime('now'))
         WHERE habit_id = ? AND date = ?`,
        [habitId, day]
    );
}

// gets percentage of habit completions for the entire day that is input, if no input, take today
// used for the colored dot for each day
export async function getHabitsStatusForDay(date?: string) {
    await initializeDatabase();
    const day = date || new Date().toISOString().split('T')[0];
    const results = await db.getAllAsync(`
        SELECT h.id, h.name, COALESCE(c.status, 0) as status
        FROM habits h
        LEFT JOIN habit_completions c
        ON h.id = c.habit_id AND c.date = ?
        WHERE c.status = 1
    `, [day]);

    return results;
}

// finds if the habit(mandatory) was completed on specified day, if day not provided, takes today
export async function getCompletedHabitsForDay(date?: string) {
    await initializeDatabase();
    const day = date || new Date().toISOString().split('T')[0];
    console.log("getting checked habits for day " + day);
    const query = `
      SELECT habit_id
      FROM habit_completions
      WHERE date = ? AND status = 1
    `;
    try {
        const results = await db.getAllAsync<{ habit_id: number }>(query, [day]);
        return results.map((row: { habit_id: number }) => row.habit_id);
    } catch (error) {
        console.error('Error in getCompletedHabitsForDay:', error, 'Date:', day);
        throw error;
    }
};