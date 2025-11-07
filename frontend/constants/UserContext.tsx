import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, addUser, updateUserBackend } from '../api/userApi';
import { User } from '../constants/interfaces';
import { Portal, Modal, Text, Button } from 'react-native-paper';
import { PaperProvider } from 'react-native-paper';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string, authMode: 'login' | 'signup', name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  errorMessage: string | null; // Add errorMessage to the context type
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error messages

  // Load stored user on app start
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          // Ensure successLimit and failureLimit have default values if missing
          setUser({
            ...parsedUser,
            successLimit: parsedUser.successLimit ?? 80,
            failureLimit: parsedUser.failureLimit ?? 20,
          });
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
      }
    })();
  }, []);

  const login = async (
    email: string,
    password: string,
    authMode: 'login' | 'signup',
    name?: string
  ) => {
    try {
      let userData: User | null = null;
  
      if (authMode === 'login') {
        userData = await loginUser(email, password);
        if (!userData) {
          setErrorMessage('Invalid email or password. Please try again.'); // Set error message
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
        setErrorMessage(null); // Clear error message on successful login
      }
    } catch (err) {
      setErrorMessage('Invalid email or password. Please try again.'); // Set error message for Axios errors
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await updateUserBackend(user.id, updates);
      setUser(updatedUser);
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <PaperProvider>
      <UserContext.Provider value={{ user, login, logout, updateUser , errorMessage}}>
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
