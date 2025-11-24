import * as SQLite from 'expo-sqlite';
import { User } from "@/constants/interfaces";

let db: SQLite.SQLiteDatabase;

// Ensure we have a reference to the database
async function getDB() {
  if (!db) db = await SQLite.openDatabaseAsync('app.db');
  return db;
}

// Add a new user
export async function addUser(name: string, email: string, password: string): Promise<User> {
  const db = await getDB();

  await db.runAsync(
    `INSERT INTO users (name, email, password, createdAt, synced) VALUES (?, ?, ?, datetime('now'), 0);`,
    [name, email, password]
  );

  const inserted = await db.getAllAsync<User>(
    `SELECT * FROM users WHERE rowid = last_insert_rowid();`
  );
  return inserted[0];
}

// Login user by email + password
export async function loginUser(email: string, password: string): Promise<User | null> {
  const db = await getDB();

  const result = await db.getAllAsync<User>(
    `SELECT * FROM users WHERE email = ? AND password = ?;`,
    [email, password]
  );

  return result[0] ?? null;
}

// Update a user
export async function updateUserBackend(userId: number, updates: Partial<User>): Promise<User> {
  const db = await getDB();

  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) throw new Error("No fields to update");

  const setString = fields.map(f => `${f} = ?`).join(', ');

  await db.runAsync(
    `UPDATE users SET ${setString}, updatedAt = datetime('now'), synced = 0 WHERE id = ?;`,
    [...values, userId]
  );

  const updated = await db.getAllAsync<User>(
    `SELECT * FROM users WHERE id = ?;`,
    [userId]
  );

  return updated[0];
}

// Get user by ID
export async function getUserById(userId: number): Promise<User | null> {
  const db = await getDB();

  const result = await db.getAllAsync<User>(
    `SELECT * FROM users WHERE id = ?;`,
    [userId]
  );

  return result[0] ?? null;
}
