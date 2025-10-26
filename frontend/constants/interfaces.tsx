export interface Habit
{
    habit_id: number;
    date: string;
    status: number;
    timestamp: string;
    name: string;
    frequency: string;
    current: number;
}

export interface HabitCompletion
{
    id: number;
    habit_id: number;
    date: string;   // YYYY-MM-DD
    status: 0 | 1;  // 0 = not completed, 1 = completed
}

export interface User
{
    id: number;
    username: string;
    name: string; // Change `username` to `name` if needed
    theme: string;
    email?: string; // Add optional fields if necessary
    createdAt?: string; // Add other fields if they exist in the database
}

export interface CompletionQueryOptions
{
    startDate: string;        // YYYY-MM-DD
    endDate?: string;         // optional, defaults to startDate
    habitIds?: number[];      // optional, if not specified, select all habits
}

export interface CountRow {
    count: number;
}