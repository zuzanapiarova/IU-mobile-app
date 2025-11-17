import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, addUser, updateUserBackend } from '../api/userApi';
import { User } from '../constants/interfaces';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermission, scheduleDailyNotification, cancelAllNotifications } from '../components/Notifications';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string, authMode: 'login' | 'signup', name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  errorMessage: string | null; // Add errorMessage to the context type
  clearErrorMessage: () => void; // clear the error message when typing
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error messages

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
        console.error('Error loading stored user:', err);
      }
    })();
  }, []);

  // login user and neccessary functionality 
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
  
        // Notification logic
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
      setErrorMessage(
        'Invalid email or password, user with this email already exists, or a network error occured. Please try again later.'
      );
    }
  };
  
  // update user on change in parameters, makes a call to backend to store new user 
  const updateUser = async (updates: Partial<User>) => {
    if (!user) return alert('You must be logged in!');
  
    try {
      const updatedUser = await updateUserBackend(user.id, updates);
      setUser(updatedUser);
  
      // Notification logic
      if (updates.notificationsEnabled !== undefined) {
        if (updates.notificationsEnabled === false)
          await cancelAllNotifications();
        else
        {
          const granted = await requestNotificationPermission();
          if (granted) {
            await cancelAllNotifications();
            await scheduleDailyNotification(user.notificationTime);
          }
        }
      }
      if (updates.notificationTime && user.notificationsEnabled === true)
      {
          await cancelAllNotifications();
          await scheduleDailyNotification(updates.notificationTime);
      }
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
    await Notifications.cancelAllScheduledNotificationsAsync(); // Cancel notifications on logout
  };

  const clearErrorMessage = () => {
    setErrorMessage(null); // Clear the error message
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
