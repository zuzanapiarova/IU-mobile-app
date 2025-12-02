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

  // Load stored user on app start
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (!storedUser) return;
  
        const parsedUser: User = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          successLimit: parsedUser.successLimit ?? 80,
          failureLimit: parsedUser.failureLimit ?? 20,
          notificationTime: parsedUser.notificationTime ?? '18:00',
        });
  
        if (parsedUser.notificationsEnabled) {
          const granted = await requestNotificationPermission();
          if (granted && parsedUser.notificationTime) {
            await cancelAllNotifications();
            await scheduleDailyNotification(parsedUser.notificationTime);
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
      let userData: User | null = null;
  
      if (authMode === 'login') {
        userData = await loginUser(email, password);
        if (!userData) {
          setErrorMessage('Invalid email or password. Please try again.');
          return;
        }
      } else if (authMode === 'signup') {
        if (!name || name.trim() === '') {
          setErrorMessage('Name is required for signup.');
          return;
        }
        userData = await addUser(name, email, password);
      }
  
      if (userData) {
        setUser(userData);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        setErrorMessage(null);
  
        if (userData.notificationsEnabled) {
          const granted = await requestNotificationPermission();
          if (granted && userData.notificationTime) {
            await cancelAllNotifications();
            await scheduleDailyNotification(userData.notificationTime);
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
