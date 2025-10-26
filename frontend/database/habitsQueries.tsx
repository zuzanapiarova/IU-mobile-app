import { db, initializeDatabase, logDatabaseContents } from './db';
import { Habit } from '../constants/interfaces'

const today = new Date().toISOString().split('T')[0];

// Add a new habit
export async function addHabit(name: string, frequency = 'daily') {
    await initializeDatabase();
    const result = await db.runAsync('INSERT INTO habits (name, frequency) VALUES (?, ?)', [name, frequency]);
    // Get the auto-incremented ID of the inserted habit
    const habitId = result.lastInsertRowId;
    await db.runAsync('INSERT INTO habit_completions (habit_id, date) VALUES (?, ?)', [habitId, today]);
}

export async function getCurrentHabitList(): Promise<any[]> {
    await initializeDatabase();
    const query = (`
        SELECT
            id AS habit_id,
            name,
            frequency,
            current
        FROM habits
        WHERE current = 1
        ORDER BY current ASC, created_at DESC
    `);
    try {
        const results = await db.getAllAsync<Habit>(query);
        // Return the entire row object for each habit
        return results.map((row) => ({
          habit_id: row.habit_id,
          name: row.name,
          frequency: row.frequency,
          current: row.current
        }));
      } catch (error) {
        console.error('Error in getHabitsForDay:', error);
        throw error;
      }
}

export async function getMostRecentDate(){
    await initializeDatabase();
    const row = await db.getFirstAsync<{ maxDate: string | null }>(
        'SELECT MAX(date) as maxDate FROM habit_completions;'
    );
    const maxDate = row?.maxDate;
    return maxDate;
}

export async function getHabitById(id: number): Promise<any> {
    await initializeDatabase();
    const result = await db.getFirstAsync('SELECT * FROM habits WHERE id = ?', [id]);
    return result;
}

// set habits to not current in habits table, so its name can still be referenced by id and we can see past habits
// also deletes it from the habit_completions table for today if it is not completed, if completed, stays
// its completion for past dates will stay for logging and history
export async function deleteHabit(id: number): Promise<void> {
    await initializeDatabase();
    await db.runAsync('UPDATE habits SET current = 0 WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM habit_completions WHERE habit_id = ? AND date = ?', [id, today]);
}

// debugging
export async function deleteHabitsforToday(): Promise<void> {
    await initializeDatabase();
    await db.runAsync('DELETE FROM habit_completions WHERE date = ?', [today]);
}

// todo: renaming habit will rename ts past occurences and completions too, change later to adding new one 
// when habit is updated, update it in the current habits list and its todays record in habits completions
export async function updateHabitName(id: number, name: string): Promise<void> {
    await initializeDatabase();
    await db.runAsync(
        'UPDATE habits SET name = ? WHERE id = ?',
        [name, id]
    );
}

// when habit is updated, update it in the current habits list and its todays record in habits completions
export async function updateHabitFrequency(id: number, frequency: string): Promise<void> {
    await initializeDatabase();
    await db.runAsync(
        'UPDATE habits SET frequency = ? WHERE id = ?',
        [frequency, id]
    );
}

// habit should be already in habit_completions with status 0, but to be sure
// add completed habit to habit_completions with status 1, or update to 1, for specified day or else today if date not specified
export async function completeHabit(habitId: number, date?: string): Promise<void> {
    await initializeDatabase();
    const day = date || today;
    await db.runAsync(`
        INSERT INTO habit_completions (habit_id, date, status, timestamp)
        VALUES (?, ?, 1, datetime('now'))
        ON CONFLICT(habit_id, date)
        DO UPDATE SET
        status = 1,
        date = ?,
        timestamp = datetime('now');`,
        [habitId, day, day]
    );
    // logDatabaseContents();
}

// set status of a habit in habit_completions to 0(uncomplete), for specified day or else today if date not specified
export async function uncompleteHabit(habitId: number, date?: string): Promise<void> {
    await initializeDatabase();
    const day = date || today;
    await db.runAsync(`
        UPDATE habit_completions
        SET status = 0
        WHERE habit_id = ? AND date = ?`,
        [habitId, day]
    );
    // logDatabaseContents();
}

// retrieves array of habid_ids that were completed on specific day
export async function getCompletedHabitsForDay(date?: string) {
    await initializeDatabase();
    const day = date || today;
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

// retrieves array of habid_ids that were completed on specific day
export async function getHabitsForDay(date?: string){
    await initializeDatabase();
    const day = date || today;
    console.log("getting habits for day " + day);
    const query = `
        SELECT hc.habit_id, hc.date, hc.status, hc.timestamp, h.name, h.frequency, h.current
        FROM habit_completions hc
        INNER JOIN habits h
        ON hc.habit_id = h.id
        WHERE hc.date = ?
        ORDER BY hc.status ASC
    `;
    try {
        const results = await db.getAllAsync<Habit>(query, [day]);
        // Return the entire row object for each habit
        return results.map((row) => ({
          habit_id: row.habit_id,
          name: row.name,
          frequency: row.frequency,
          date: row.date,
          status: row.status,
          timestamp: row.timestamp,
          current: row.current,

        }));
      } catch (error) {
        console.error('Error in getHabitsForDay:', error, 'Date:', day);
        throw error;
      }
};

// todo: take into account frequency, if habit is to be added daily or eg. just for mondays
// called on app startup to populate the habit completions table with status 0 from curremnt habits 
export async function initializeHabitCompletionsForDay(date?:string) {
    const day = date || today;
    await initializeDatabase();
  
    try {
      const habits = await db.getAllAsync<{ id: number }>(`SELECT id FROM habits where current = 1;`);
      if (habits.length === 0)
        return;
  
      // insert habits into habit_completions if they don't already exist for the day
      const insertQuery = `
        INSERT INTO habit_completions (habit_id, date, status)
        SELECT 
            id AS habit_id,
            ? AS date,
            0 as status
        FROM habits
        WHERE current = 1
        AND id NOT IN (
            SELECT habit_id 
            FROM habit_completions 
            WHERE date = ?
        );
      `;
      await db.runAsync(insertQuery, [day, day]);
      console.log(`✅ Initialized habit completions for ${today}`);
    } catch (error) {
      console.error('❌ Error initializing habit completions:', error);
      throw error;
    }
  }