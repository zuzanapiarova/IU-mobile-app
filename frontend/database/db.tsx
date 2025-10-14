// import * as SQLite from 'expo-sqlite';

// export const db = SQLite.openDatabaseSync('test10.db');

// export async function initializeDatabase()
// {

//   // habits list
//   await db.execAsync(`
//     CREATE TABLE IF NOT EXISTS habits (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       frequency TEXT DEFAULT 'daily',
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     );
//   `);

//   // habit completions and overview
//   //   add    date TEXT NOT NULL CHECK(date GLOB ____-__-__),
//   await db.execAsync(`
//     CREATE TABLE IF NOT EXISTS habit_completions (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       habit_id INTEGER NOT NULL,
//       date TEXT NOT NULL CHECK(date GLOB '____-__-__'),
//       status INTEGER NOT NULL CHECK(status IN (0, 1)),
//       timestamp TEXT DEFAULT (datetime('now')),
//       FOREIGN KEY (habit_id) REFERENCES habits(id),
//       UNIQUE(habit_id, date)
//     );
//   `);
//   const result2 = await db.getAllAsync(`PRAGMA table_info(habit_completions);`);
//   console.log(result2);

//   // users
//   await db.execAsync(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       email TEXT,
//       theme_preference TEXT DEFAULT 'system',
//       created_at TEXT DEFAULT CURRENT_TIMESTAMP
//     );
//   `);
// }

import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('habits3.db');

let initialized = false;

/**
 * Initialize the database (run once)
 * @param force - optional, drop & recreate tables for dev
 */
export async function initializeDatabase({ force = false } = {}) {
  if (initialized && !force) return;

  console.log(force ? '⚠️ Re-initializing DB (force)' : 'Initializing DB...');

  if (force) {
    try {
      await db.execAsync(`DROP TABLE IF EXISTS habit_completions;`);
      await db.execAsync(`DROP TABLE IF EXISTS habits;`);
      await db.execAsync(`DROP TABLE IF EXISTS users;`);
      console.log('Dropped old tables');
    } catch (err) {
      console.error('Error dropping tables:', err);
    }
  }

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // date TEXT NOT NULL CHECK(date GLOB '____-__-__')
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status INTEGER NOT NULL CHECK(status IN (0, 1)),
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      UNIQUE(habit_id, date)
    );
  `);

  const result = await db.getAllAsync(`SELECT sql FROM sqlite_master WHERE name='habit_completions';`);
  console.log(result);

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

export async function logDatabaseContents() {
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