import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, ActivityIndicator, Text } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { initializeHabitCompletions } from '../components/init';
import { globalStyles } from '@/constants/globalStyles';
import { UserProvider, useUser } from '../constants/UserContext';
import Login from '../components/Login';

function AppContent() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const [isLoading, setIsLoading] = useState(true);

  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors[scheme].tint,
      secondary: Colors[scheme].accent,
      background: Colors[scheme].background,
      surface: Colors[scheme].surface,
      onSurface: Colors[scheme].text,
      onBackground: Colors[scheme].text,
      outline: Colors[scheme].border,
      shadow: Colors[scheme].shadow,
      icon: Colors[scheme].icon,
      tabIconDefault: Colors[scheme].tabIconDefault,
      tabIconSelected: Colors[scheme].tabIconSelected
    },
  };

  useEffect(() => {
    const initializeApp = async () => {
      if (!user) return; // Wait until user is set

      try {
        await initializeHabitCompletions();
        console.log("✅Initialized habit completions.");
      } catch (err) {
        console.error('❌ Error during app initialization:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, [user]);

  // Render login if user is not logged in
  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
          Login or Sign Up
        </Text>
        <Login onClose={() => {}} />
      </View>
    );
  }

  // Render loading state while initializing
  if (isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator animating size="large" color={customTheme.colors.primary} />
      </View>
    );
  }

  // Render main app stack
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors[scheme].tint,
      secondary: Colors[scheme].accent,
      background: Colors[scheme].background,
      surface: Colors[scheme].surface,
      onSurface: Colors[scheme].text,
      onBackground: Colors[scheme].text,
      outline: Colors[scheme].border,
      shadow: Colors[scheme].shadow,
      icon: Colors[scheme].icon,
      tabIconDefault: Colors[scheme].tabIconDefault,
      tabIconSelected: Colors[scheme].tabIconSelected
    },
  };

  return (
    <UserProvider>
      <PaperProvider theme={customTheme}>
        <AppContent />
      </PaperProvider>
    </UserProvider>
  );
}