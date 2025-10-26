import { db, initializeDatabase } from './db';
import { User } from '@/constants/interfaces';

// export async function getUser(): Promise<User | null> {
//     await initializeDatabase();
//     return await db.getFirstAsync('SELECT * FROM users LIMIT 1');
// }

// changeName

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
    await initializeDatabase();
    const query = `
      SELECT id, username, theme, email, created_at AS createdAt
      FROM users
      WHERE username = ?
    `;
    try {
      const results = await db.getAllAsync<{
        id: number;
        username: string;
        theme: string;
        email?: string;
        createdAt?: string;
      }>(query, [username]);
  
      if (results.length > 0) {
        const row = results[0];
        return {
          id: row.id,
          username: row.username,
          name: row.username, // Map `username` to `name` if `name` is not stored in the database
          theme: row.theme,
          email: row.email || undefined, // Default to null if email is not provided
          createdAt: row.createdAt || undefined, // Default to null if createdAt is not provided
        };
      }
  
      return null; // No matching user found
    } catch (error) {
      console.error('Error in getUserByUsername:', error, 'Username:', username);
      throw error;
    }
  }

// Create a new user with default values
export async function createUser(username: string, password: string): Promise<User> {
    await initializeDatabase();
    const defaultValues = { theme: 'light', email: undefined }; // Use `undefined` for optional fields
  
    try {
      // Insert the new user into the database
      const result = await db.runAsync(
        'INSERT INTO users (username, password, theme, email) VALUES (?, ?, ?, ?)',
        [username, password, defaultValues.theme, defaultValues.email]
      );
  
      // Construct and return the User object
      return {
        id: result.insertId, // Use the auto-generated ID from the database
        username: username,
        name: username, // Default `name` to `username` for new users
        theme: defaultValues.theme,
        email: defaultValues.email, // Use `undefined` for optional fields
        createdAt: new Date().toISOString(), // Set the current timestamp as `createdAt`
      };
    } catch (error) {
      console.error('Error in createUser:', error, 'Username:', username);
      throw error;
    }
  }