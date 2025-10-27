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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for error messages
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false); // State for modal visibility

  // Load stored user on app start
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error loading stored user:', err);
      }
    })();
  }, []);

  const showErrorModal = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalVisible(true);
  };

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
          showErrorModal('Invalid credentials. Please check your email and password.');
          return;
        }
        // The backend handles password checking
      } else if (authMode === 'signup') {
        if (!name || name.trim() === '') {
          showErrorModal('Name is required for signup.');
          return;
        }
        userData = await addUser(name, email, password);
      }

      if (userData) {
        setUser(userData);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Error during login/signup:', err);
      showErrorModal('An error occurred. Please try again.');
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
      showErrorModal('Failed to update user. Please try again.');
    }
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <PaperProvider>
      <UserContext.Provider value={{ user, login, logout, updateUser }}>
        {children}
        {/* Modal for error message  */}
        <Portal>
          <Modal visible={isErrorModalVisible} onDismiss={() => setIsErrorModalVisible(false)}>
            <Text style={{ margin: 16 }}>{errorMessage}</Text>
            <Button mode="contained" onPress={() => setIsErrorModalVisible(false)}>
              Close
            </Button>
          </Modal>
        </Portal>
      </UserContext.Provider>
    </PaperProvider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
