import React from "react";

export interface Habit
{
    id: number;
    name: string;
    frequency: string;
    status: boolean;
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
    name: string;
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