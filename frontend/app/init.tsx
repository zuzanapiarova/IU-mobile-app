import { initializeHabitCompletionsForDay, getMostRecentDate } from "../api/habitsApi";
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { createNotificationChannel } from '../components/Notifications';

let db: SQLite.SQLiteDatabase;

// on app start, populates the habit completions with current habits and status false for all records since last app open
export async function initializeHabitCompletions() {
  const today = new Date().toISOString().split("T")[0];

  try {
    const mostRecentDate = (await getMostRecentDate()) ?? null;

    let currentDate = mostRecentDate
      ? new Date(mostRecentDate)
      : new Date(today);

    while (currentDate <= new Date(today)) {
      const dateString = currentDate.toISOString().split("T")[0];
      await initializeHabitCompletionsForDay(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log('✅ Habit completions initialized.');
  } catch (error) {
    console.error("Error initializing missing habit completions:", error);
    throw error;
  }
}

// todo: add check that if user is no authorized or not exist, do not even continue

// initialize and manage offline resourcesso the app works even without internet connection
// on app open or reconect, sync teh data with backend
export const OfflineManager = {
  currentUserId: null as number | null,

  setCurrentUser: (userId: number | null) => {
    OfflineManager.currentUserId = userId;
  },

  initializeDatabase: async () => {
    db = await SQLite.openDatabaseAsync("app.db");

    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        themePreference TEXT NOT NULL DEFAULT 'system',
        language TEXT NOT NULL DEFAULT 'en',
        dataProcessingAgreed INTEGER NOT NULL DEFAULT 0,
        notificationsEnabled INTEGER NOT NULL DEFAULT 1,
        notificationTime TEXT NOT NULL DEFAULT '18:00',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT,
        successLimit INTEGER NOT NULL DEFAULT 80,
        failureLimit INTEGER NOT NULL DEFAULT 20,
        synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'daily',
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        userId INTEGER NOT NULL,
        current INTEGER NOT NULL DEFAULT 1,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habitId INTEGER NOT NULL,
        date TEXT NOT NULL,
        status INTEGER NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(habitId, date)
      );
    `);
  },

  syncWithBackend: async () => {
    if (!OfflineManager.currentUserId) return;

    try {
      // get user data from backend and auth
      const response = await fetch(`${process.env.BACKEND_IP || "http://localhost:8000"}/sync?userId=${OfflineManager.currentUserId}`);
      const backend = await response.json();

      // backend should send { users: [], habits: [], completions: [] }
      await db.withTransactionAsync(async () => {
        for (const u of backend.users) {
          await db.runAsync(
            `INSERT OR REPLACE INTO users
            (id,name,email,password,themePreference,language,dataProcessingAgreed,
             notificationsEnabled,notificationTime,createdAt,updatedAt,
             successLimit,failureLimit,synced)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1);`,
            [
              u.id, u.name, u.email, u.password, u.themePreference,
              u.language, u.dataProcessingAgreed, u.notificationsEnabled,
              u.notificationTime, u.createdAt, u.updatedAt,
              u.successLimit, u.failureLimit
            ]
          );
        }

        for (const h of backend.habits) {
          await db.runAsync(
            `INSERT OR REPLACE INTO habits
             (id,name,frequency,createdAt,userId,current,synced)
             VALUES (?,?,?,?,?,?,1);`,
            [
              h.id, h.name, h.frequency, h.createdAt,
              h.userId, h.current
            ]
          );
        }

        for (const c of backend.completions) {
          await db.runAsync(
            `INSERT OR REPLACE INTO habit_completions
             (id,habitId,date,status,timestamp,synced)
             VALUES (?,?,?,?,?,1);`,
            [
              c.id, c.habitId, c.date, c.status, c.timestamp
            ]
          );
        }
      });

      // push unsynced local data
      const unsyncedUsers = await db.getAllAsync(`SELECT * FROM users WHERE synced = 0;`);
      const unsyncedHabits = await db.getAllAsync(`SELECT * FROM habits WHERE synced = 0;`);
      const unsyncedCompletions = await db.getAllAsync(`SELECT * FROM habit_completions WHERE synced = 0;`);

      if (unsyncedUsers.length || unsyncedHabits.length || unsyncedCompletions.length) {
        await fetch(`${process.env.BACKEND_IP}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            users: unsyncedUsers,
            habits: unsyncedHabits,
            completions: unsyncedCompletions
          })
        });

        await db.execAsync(`
          UPDATE users SET synced = 1 WHERE synced = 0;
          UPDATE habits SET synced = 1 WHERE synced = 0;
          UPDATE habit_completions SET synced = 1 WHERE synced = 0;
        `);
      }
    } catch (error) {
      console.error("SYNC ERROR:", error);
    }
  },

  // listen for networkConnection event and sync local and backend when connection available
  setupNetworkListener: () => {
    NetInfo.addEventListener((state: any) => {
      if (state.isConnected) OfflineManager.syncWithBackend();
    });
  },

  initializeAndSync: async () => {
    await OfflineManager.initializeDatabase();
    await initializeHabitCompletions();
    await OfflineManager.syncWithBackend();
    createNotificationChannel();
  },

  logoutAndClearLocal: async () => {
    await db.execAsync(`
      DELETE FROM habit_completions;
      DELETE FROM habits;
      DELETE FROM users;
      VACUUM;
    `);
    OfflineManager.currentUserId = null;
  }
};