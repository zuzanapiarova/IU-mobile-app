import React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { initializeDatabase } from '../database/db'
import { initializeHabitCompletions } from '../database/init';

export default function RootLayout()
{

  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeDatabase(); // Ensure tables are created
        console.log('✅ Database initialized');
        await initializeHabitCompletions(); // Initialize missing habit completions
      } catch (err) {
        console.error('❌ Error during app initialization:', err);
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

  return (
    <PaperProvider theme={customTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}