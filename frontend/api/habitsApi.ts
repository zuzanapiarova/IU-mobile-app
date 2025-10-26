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