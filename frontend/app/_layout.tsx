import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { initializeDatabase } from '../database/db';
import { initializeHabitCompletions } from '../database/init';
import { globalStyles } from '@/constants/globalStyles';
import { UserProvider } from '../constants/UserContext';
import { initializeDatabase, logDatabaseContents } from '../database/db'
import { getAllHabits } from '../api/habitsApi'

export default function RootLayout()
{

  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const [isLoading, setIsLoading] = useState(true); // Track loading state
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeDatabase(); // Ensure tables are created
        console.log('✅ Database initialized');
        await initializeHabitCompletions(); // Initialize missing habit completions
      } catch (err) {
        console.error('❌ Error during app initialization:', err);
      } finally {
        setIsLoading(false); // Set loading to false after initialization
      }

      try {
        const habits = await getAllHabits();
        console.log('New Habits:', habits);
      } catch (error) {
        console.error('Error fetching habits:', error);
      }
    };
    initializeApp(); // Call the async function
  }, []);

  // Merge your custom palette with Paper’s expected tokens
  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors[scheme].tint,              // used for buttons, switches, etc.
      secondary: Colors[scheme].accent,          // used for highlights
      background: Colors[scheme].background,     // used for full-page bg
      surface: Colors[scheme].surface,           // used for cards/surfaces
      onSurface: Colors[scheme].text,            // text color on surfaces
      onBackground: Colors[scheme].text,
      outline: Colors[scheme].border,            // borders & dividers
      shadow: Colors[scheme].shadow,
      icon: Colors[scheme].icon,
      tabIconDefault: Colors[scheme].tabIconDefault,
      tabIconSelected: Colors[scheme].tabIconSelected
    },
  };

  if (isLoading) {
    // Render the loading screen while the app is initializing
    return (
      <UserProvider>
        <PaperProvider theme={customTheme}>
          <View style={globalStyles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color={customTheme.colors.primary} />
          </View>
        </PaperProvider>
      </UserProvider>
    );
  }

  // Render the main app layout after initialization
  return (
    <UserProvider>
      <PaperProvider theme={customTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </UserProvider>
  );
}