import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User } from "@/constants/interfaces";

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

// Add a new user
export async function addUser(name: string, email: string) {
  const { data } = await api.post('/users', { name, email });
  return data;
}

// Get user by username
export async function getUserByUsername(username: string) {
  const { data } = await api.get(`/users/${username}`);
  return data;
}