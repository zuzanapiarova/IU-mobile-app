import { db, initializeDatabase } from './db';
import { User } from '@/constants/interfaces';

export async function getUser(): Promise<User | null> {
    await initializeDatabase();
    return await db.getFirstAsync('SELECT * FROM users LIMIT 1');
}

export async function setUserName(name: string): Promise<void> {
    await initializeDatabase();
    await db.runAsync('UPDATE users SET name = ? WHERE id = 1', [name]);
}