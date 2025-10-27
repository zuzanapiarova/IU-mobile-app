export interface Habit
{
    id: number;
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

export interface HabitWithCompletion {
    id: number; // ID of the habit completion
    habit_id: number; // ID of the associated habit
    name: string; // Name of the habit
    frequency: string; // Frequency of the habit (e.g., daily, weekly)
    date: string; // Date of the habit completion (YYYY-MM-DD)
    status: number; // Status of the habit (0 = incomplete, 1 = complete)
    timestamp: string; // Timestamp of the last update
    current: boolean; // Whether the habit is active
}

export interface User
{
    id: number;
    name: string;
    email: string; // Add optional fields if necessary
    createdAt: string;
    themePreference?: 'light' | 'dark' | 'system';
    hasAcceptedTerms?: boolean;
    dataProcessingAgreed?: boolean;
    notificationsEnabled?: boolean;
    successLimit: number; // The percentage threshold for success (default: 80)
    failureLimit: number; // The percentage threshold for failure (default: 20)
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