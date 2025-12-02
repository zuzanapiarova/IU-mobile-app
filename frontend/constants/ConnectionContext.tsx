import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

// tracks if the device is online, if the backend is rechable, and sets the message to be displayed on the error banner 
interface ConnectionContextType {
  isConnected: boolean;
  isBackendReachable: boolean;
  setIsConnected: (status: boolean) => void;
  setIsBackendReachable: (status: boolean) => void;
  bannerMessage: string | null;
  setBannerMessage: (message: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isBackendReachable, setIsBackendReachable] = useState(true); // Default to true
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        isConnected,
        isBackendReachable,
        setIsConnected,
        setIsBackendReachable,
        bannerMessage,
        setBannerMessage,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context)
    throw new Error('useConnection must be used within a ConnectionProvider');

  return context;
};