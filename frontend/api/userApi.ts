import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { User } from "@/constants/interfaces";

// http client to make GET/POST/PUT/DELETE requests in node apps
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000';
export const api = axios.create({
  baseURL: apiUrl,
  timeout: 5000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Call to backend to add a new user during signup
export async function addUser(name: string, email: string, password: string): Promise<User> {
  try {
    const { data } = await api.post('/users', { name, email, password });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('The request timed out. Please try again.');
      } else if (error.response) {
        throw new Error(error.response.data?.error?.message || 'Failed to add user.');
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Backend must be running for the data to be loaded. Try again later.');
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

// Call to backend to get user by email during login
export async function loginUser(email: string, password: string): Promise<User | null> {
	try {
		const res = await api.post(`/login`, { email, password });
		return res.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.code === 'ECONNABORTED') {
				throw new Error('The request timed out. Please try again.');
			} else if (error.response) {
				throw new Error(error.response.data?.error?.message || 'Authentication failed');
			} else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to the backend. Backend must be running for the data to be loaded. Try again later.');
			}
		}
		throw new Error('An unexpected error occurred. Please try again.');
	}
}

// call to backend to update user information
export async function updateUserBackend(userId: number, updates: Partial<User>): Promise<User> {

  try {
    const { data } = await api.put(`/users/${userId}`, updates);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
       if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        throw new Error('Unable to connect to the backend. Backend must be running for the data to be loaded. Try again later.');
			} else if (error.response) {
				throw new Error(error.response.data?.error?.message || 'Failed to update user.');
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}