import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Habit } from "@/constants/interfaces";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.41:3000',
  timeout: 8000,
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fetch all habits
export async function getAllHabits(): Promise<Habit[]>{
  const { data } = await api.get('/habits');
  console.log("Calling API:", api.defaults.baseURL);
  return data;
}

// TODO: change userId from 1 to real user id 
// Add a new habit
export async function addHabit(name: string, frequency: string = 'daily', userId = 1) {
  const { data } = await api.post('/habits', { name, frequency, userId});
  return data;
}

// Get a habit by ID
export async function getHabitById(id: number): Promise<Habit> {
  const { data } = await api.get(`/habits/${id}`);
  return data;
}

// Delete a habit
export async function deleteHabit(id: number) {
  const { data } = await api.delete(`/habits/${id}`);
  return data;
}

// Update a habit
export async function updateHabit(id: number, name: string, frequency: string) {
  const { data } = await api.put(`/habits/${id}`, { name, frequency });
  return data;
}

// todo: renaming habit will rename ts past occurences and completions too, change later to adding new one 
// Update a habit's name
// export async function updateHabitName(id: number, name: string): Promise<void> {
//   const { data } = await api.put(`/habits/${id}/name`, { name });
//   return data;
// }
// // Update a habit's frequency
// export async function updateHabitFrequency(id: number, frequency: string): Promise<void> {
//   const { data } = await api.put(`/habits/${id}/frequency`, { frequency });
//   return data;
// }

// Complete a habit
export async function completeHabit(habitId: number, date?: string) {
  const { data } = await api.post(`/habits/${habitId}/complete`, { date });
  return data;
}

// Uncomplete a habit
export async function uncompleteHabit(habitId: number, date?: string) {
  const { data } = await api.post(`/habits/${habitId}/uncomplete`, { date });
  return data;
}

// Get completed habits for a specific day
export async function getCompletedHabitsForDay(date?: string) {
  const { data } = await api.get(`/habits/completed`, {
    params: { date: date || new Date().toISOString().split('T')[0] },
  });
  return data;
}

// Get completion percentage for a specific day
export async function getCompletionPercentageForDay(date: string): Promise<{ date: string; percentage: number }> {
  const { data } = await api.get('/completion-percentage', {
    params: { date },
  });
  return data;
}

// Get habits for a specific day
export async function getHabitsForDay(date?: string) {
  const { data } = await api.get('/habits-for-day', {
    params: { date },
  });
  return data;
}

// Initialize habit completions for a specific day
export async function initializeHabitCompletionsForDay(date?: string) {
  const { data } = await api.post('/initialize-habit-completions', { date });
  return data;
}

// Get the most recent date from habit completions
export async function getMostRecentDate(): Promise<string | null> {
  const { data } = await api.get('/habits-completions/most-recent-date');
  return data.maxDate;
}