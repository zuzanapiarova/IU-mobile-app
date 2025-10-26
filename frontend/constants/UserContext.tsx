import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserByUsername, addUser } from '../api/userApi';
import { User } from '../constants/interfaces';

interface UserContextType {
  user: User | null;
  login: (username: string, password: string, authMode: 'login' | 'signup') => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string, authMode: 'login' | 'signup') => {
    try {
      if (authMode === 'login') {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
          setUser(existingUser); // Log the user in
        } else {
          alert('Invalid credentials. Please try again.');
        }
      } else if (authMode === 'signup') {
        const newUser = await addUser(username, password); // Create a new user
        setUser(newUser); // Log the new user in
      }
    } catch (error) {
      console.error('Error during login/signup:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const logout = () => {
    setUser(null); // Clear the user state
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};