import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { UserProvider } from '../constants/UserContext';

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
      tabIconSelected: Colors[scheme].tabIconSelected,
      secondaryContainer:Colors[scheme].tint, 
      surfaceVariant:Colors[scheme].background
    },
  };

  return (
    <UserProvider>
      <PaperProvider theme={customTheme}>
        {/* Always render navigation tree */}
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </UserProvider>
  );
}
