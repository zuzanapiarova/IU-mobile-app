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
export async function addUser(name: string, email: string, password: string): Promise<User> {
  const { data } = await api.post('/users', { name, email, password });
  return data;
}

// login user - get user by email
export async function loginUser(email: string, password: string): Promise<User | null> {
  const res = await api.post(`/login`, { email, password });
  return res.data;
}

export async function updateUserBackend(userId: number, updates: Partial<User>): Promise<User> {
  console.log('Updates:', updates); // Log the updates object to verify its content
  const { data } = await api.put(`/users/${userId}`, updates);
  return data;
}
