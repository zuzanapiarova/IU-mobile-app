import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Habit } from "@/constants/interfaces";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000',
  timeout: 5000,
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fetch all habits for the logged-in user
export async function getAllHabits(userId: number): Promise<Habit[]> {
  try {
    const { data } = await api.get('/habits', { params: { userId } });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Add a new habit
export async function addHabit(name: string, frequency: string = 'daily', userId: number) {
  try {
    const { data } = await api.post('/habits', { name, frequency, userId });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Get a habit by ID
export async function getHabitById(id: number): Promise<Habit> {
  try {
    const { data } = await api.get(`/habits/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Delete a habit
export async function deleteHabit(id: number) {
  try {
    const { data } = await api.delete(`/habits/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Update a habit
export async function updateHabit(id: number, name: string, frequency: string) {
  try {
    const { data } = await api.put(`/habits/${id}`, { name, frequency });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Complete a habit
export async function completeHabit(habitId: number, date?: string) {
  try {
    const { data } = await api.post(`/habits/${habitId}/complete`, { date });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Uncomplete a habit
export async function uncompleteHabit(habitId: number, date?: string) {
  try {
    const { data } = await api.post(`/habits/${habitId}/uncomplete`, { date });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Get completed habits for a specific day
export async function getCompletedHabitsForDay(date?: string) {
  try {
    const { data } = await api.get(`/habits/completed`, {
      params: { date: date || new Date().toISOString().split('T')[0] },
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Get completion percentage for a specific day
export async function getCompletionPercentageForDay(date: string): Promise<{ date: string; percentage: number }> {
  try {
    const { data } = await api.get('/completion-percentage', {
      params: { date },
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Get habits for a specific day for the logged-in user
export async function getHabitsForDay(userId: number, allowDeleted: boolean, date?: string) {
  try {
    const { data } = await api.get('/habits-for-day', {
      params: { userId, allowDeleted, date },
    });
    return data; // data: { habitId: parseInt(habitId), streak: longestStreak }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Initialize habit completions for a specific day - REDO: add user id
export async function initializeHabitCompletionsForDay(date?: string) {
  try {
    const { data } = await api.post('/initialize-habit-completions', { date });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Get the most recent date from habit completions - REDO: add user id
export async function getMostRecentDate(): Promise<string | null> {
  try {
    const { data } = await api.get('/habits-completions/most-recent-date');
    return data.maxDate;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export async function getHabitStreak(userId: number, habitId: number, startsAfterDate: string)
{
  try {
    const { data } = await api.get('/habit-streaks', { params: { userId, habitId, startsAfterDate } });
    return data; // Expected response: [{ habitId, streak }]
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again later.');
      } else if (error.response) {
        throw new Error(`Server responded with status ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}