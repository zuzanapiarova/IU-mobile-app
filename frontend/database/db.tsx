import * as SQLite from 'expo-sqlite';

export const  db = SQLite.openDatabaseSync('habits3.db');
let           initialized = false;

export async function initializeDatabase() {
  if (initialized) return;

  // list of all habits, current and past, for populating habit completions and retrospecive view  
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      current INTEGER CHECK(current IN (0, 1)) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // date TEXT NOT NULL CHECK(date GLOB '____-__-__')
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status INTEGER CHECK(status IN (0, 1)) DEFAULT 0,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, date)
    );
  `);

  const result = await db.getAllAsync(`SELECT sql FROM sqlite_master WHERE name = 'habit_completions';`);
  console.log("habit completions table: \n" + result);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      theme_preference TEXT DEFAULT 'system',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  initialized = true;
  console.log('✅ Database initialized');
}

// ! debug 
// export async function clearToday()
// {
//   await db.runAsync(`DELETE FROM habits WHERE current = 0`);
// }

export async function logDatabaseContents()
{
  try {
    console.log('Logging database contents...');

    // Get the list of tables in the database
    const tables = await db.getAllAsync<{ name: string }>(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);

    if (tables.length === 0) {
      console.log('No tables found in the database.');
      return;
    }

    // Log the contents of each table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nTable: ${tableName}`);

      const rows = await db.getAllAsync(`SELECT * FROM ${tableName};`);
      if (rows.length === 0) {
        console.log(`No data found in table: ${tableName}`);
      } else {
        console.log(`Contents of table ${tableName}:`, rows);
      }
    }
  } catch (error) {
    console.error('Error logging database contents:', error);
  }
}

export default db;