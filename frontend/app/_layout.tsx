import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { UserProvider, useUser } from '../constants/UserContext';

function ThemedApp() {
  const { user } = useUser();
  const scheme = user?.themePreference === 'dark' ? 'dark' : 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const customTheme = useMemo(() => ({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors[scheme].tint,
      onPrimary: Colors[scheme].background,
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
      secondaryContainer: Colors[scheme].tint,
      surfaceVariant: Colors[scheme].background,
      surfaceDisabled: Colors[scheme].disabled, 
      onSurfaceDisabled: Colors[scheme].disabledText
    },
  }), [scheme]);

  return (
    <PaperProvider theme={customTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <ThemedApp />
    </UserProvider>
  );
}