import React, { useMemo, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Colors } from '@/constants/theme';
import { UserProvider, useUser } from '../constants/UserContext';
import { createNotificationChannel } from '../components/Notifications';
import { ConnectionProvider } from '../constants/ConnectionContext';
import GlobalBanner from '@/components/GlobalBanner';
import { getMostRecentDate, initializeHabitCompletionsForDay } from '@/api/habitsApi';
import Loading from '@/components/Loading';
import { useConnection } from '../constants/ConnectionContext';
 
export async function initializeHabitCompletions()
{
  const today = new Date().toISOString().split("T")[0];
  
  try {
    const mostRecentDate = (await getMostRecentDate()) ?? null;

    let currentDate = mostRecentDate
      ? new Date(mostRecentDate)
      : new Date(today);

    while (currentDate <= new Date(today)) {
      const dateString = currentDate.toISOString().split("T")[0];
      await initializeHabitCompletionsForDay(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } catch (error) {
    throw error;
  }
}

// app entrypoint
function ThemedApp() {
  const { user } = useUser();
  const { setBannerMessage } = useConnection();
  const [loading, setLoading] = useState(false);
  const scheme = user?.themePreference === 'dark' ? 'dark' : 'light';
  const baseTheme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  // customize the theme used for react native paper components
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
  }), [scheme, baseTheme]);

  useEffect(() => {
    createNotificationChannel();
    const initialize = async () => {
      try {
        await initializeHabitCompletions();
      } catch (error) {
        if (error instanceof Error) setBannerMessage(error.message);
        else setBannerMessage('An unexpected error occurred. Please try again.');
      }
    };

    initialize();
  }, []);

  if (loading) return <Loading/>;

  return (
    <PaperProvider theme={customTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' }
        }}
      />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ConnectionProvider>
      <UserProvider>
        <GlobalBanner />
        <ThemedApp />
      </UserProvider>
    </ConnectionProvider>
  );
}