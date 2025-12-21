import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, addUser, updateUserBackend } from '../api/userApi';
import { User } from '../constants/interfaces';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermission, scheduleDailyNotification, cancelAllNotifications } from '../components/Notifications';
import { useConnection } from './ConnectionContext';

// user context type with props
interface UserContextType {
  user: User | null;
  login: (email: string, password: string, authMode: 'login' | 'signup', name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  errorMessage: string | null;
  clearErrorMessage: () => void;
}

// create user context which has global state
const UserContext = createContext<UserContextType | undefined>(undefined);

// Decode JWT payload to check expiry (no external deps)
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setBannerMessage } = useConnection();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) { 
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  // Load stored user on app start, but only if token exists and is valid
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');

        if (!token) {
          setUser(null);
          if (storedUser) await SecureStore.deleteItemAsync('user');
          return;
        }

        if (isJwtExpired(token)) {
          await SecureStore.deleteItemAsync('token');
          if (storedUser) await SecureStore.deleteItemAsync('user');
          setUser(null);
          setBannerMessage('Your session has expired. Please log in again.');
          return;
        }

        if (!storedUser) return;

        const parsedUser: User = JSON.parse(storedUser);
        const normalizedUser: User = {
          ...parsedUser,
          successLimit: parsedUser.successLimit ?? 80,
          failureLimit: parsedUser.failureLimit ?? 20,
          notificationTime: parsedUser.notificationTime ?? '18:00',
        };
        setUser(normalizedUser);

        // Restore notifications per stored preferences
        if (normalizedUser.notificationsEnabled) {
          const granted = await requestNotificationPermission();
          if (granted && normalizedUser.notificationTime) {
            await cancelAllNotifications();
            await scheduleDailyNotification(normalizedUser.notificationTime);
          }
        } else {
          await cancelAllNotifications();
        }
      } catch (err) {
        if (err instanceof Error && err.message !== undefined) {
          setBannerMessage(err.message);
        } else {
          setBannerMessage('An unexpected error occurred. Please try again later.');
        }
      }
    })();
  }, []);

  // login user and neccessary functionality, shown and called only on login page
  const login = async (
    email: string,
    password: string,
    authMode: 'login' | 'signup',
    name?: string
  ) => {
    try {
      if (!validateEmail(email)) return;

      let auth:
        | { user: User; token: string }
        | null = null;

      if (authMode === 'login') {
        auth = await loginUser(email, password);
        if (!auth || !auth.user || !auth.token) {
          setErrorMessage('Invalid email or password. Please try again.');
          return;
        }
      } else if (authMode === 'signup') {
        if (!name || name.trim() === '') {
          setErrorMessage('Name is required for signup.');
          return;
        }
        auth = await addUser(name, email, password);
      }

      if (auth) {
        // Persist token and user
        await SecureStore.setItemAsync('token', auth.token);
        await SecureStore.setItemAsync('user', JSON.stringify(auth.user));
        setUser(auth.user);
        setErrorMessage(null);

        if (auth.user.notificationsEnabled) {
          const granted = await requestNotificationPermission();
          if (granted && auth.user.notificationTime) {
            await cancelAllNotifications();
            await scheduleDailyNotification(auth.user.notificationTime);
          }
        } else {
          await cancelAllNotifications();
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message !== undefined) {
        setBannerMessage(err.message);
      } else {
        setBannerMessage('An unexpected error occurred. Please try again later.');
      }
    }
  };
  
  // update user on change in parameters, called only from Profile screen
  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      setBannerMessage('You must be logged in!');
      throw new Error('You must be logged in!');
    }
  
    try {
      const updatedUser = await updateUserBackend(user.id, updates);
      setUser(updatedUser);

      if (updates.notificationsEnabled !== undefined) {
        if (updates.notificationsEnabled === false) {
          await cancelAllNotifications();
        } else {
          const granted = await requestNotificationPermission();
          if (granted) {
            await cancelAllNotifications();
            await scheduleDailyNotification(user.notificationTime);
          }
        }
      }
      if (updates.notificationTime && user.notificationsEnabled === true) {
        await cancelAllNotifications();
        await scheduleDailyNotification(updates.notificationTime);
      }
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    } catch (err) {
      if (err instanceof Error && err.message !== undefined) {
        setBannerMessage(err.message);
      } else {
        setBannerMessage('An unexpected error occurred. Please try again later.');
      }
      throw err;
    }
  };

  // handle logout 
  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('token');
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const clearErrorMessage = () => {
    setErrorMessage(null);
    setBannerMessage(null);
  };

  return (
    <PaperProvider>
      <UserContext.Provider value={{ user, login, logout, updateUser, errorMessage, clearErrorMessage}}>
        {children}
      </UserContext.Provider>
    </PaperProvider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};