import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, Card, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useUser } from '../../constants/UserContext';
import { initializeHabitCompletions } from '@/components/init';
import { globalStyles } from '../../constants/globalStyles';

import HabitsList from '@/components/HabitsCheckList';
import StatusCalendar from '@/components/StatusCalendar';

export default function HomeScreen() {
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();
  const theme = useTheme();
  const { user } = useUser();
  const navigationState = useRootNavigationState(); // Check if navigation is ready
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigationState?.key) return; // Wait until the navigation system is ready
    const initialize = async () => {
      try {
        if (!user) {
          // If no user is logged in, redirect to the login screen
          router.replace('/login');
          return;
        }

        // Logged in → initialize user data
        await initializeHabitCompletions();
        console.log('✅ Habit completions initialized.');
      } catch (err) {
        console.error('❌ Error initializing app:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [user, navigationState?.key]);

  // While initializing or redirecting
  if (!navigationState?.key || isLoading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator animating size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Render the main screen only if the user is logged in
  if (!user) {
    return null; // Prevent rendering if the user is not logged in
  }

  // Only render actual UI after initialization
  return (
    <Surface
      style={[globalStyles.display, { backgroundColor: theme.colors.surface, flex: 1 }]}
      elevation={0}
    >
      <Text variant="displaySmall">
        Welcome back, {user?.name ?? 'Guest'}!
      </Text>

      <Surface
        style={[
          globalStyles.container,
          { height: 300, backgroundColor: theme.colors.background },
        ]}
      >
        <HabitsList date={today} />
      </Surface>

      <Card style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
        <StatusCalendar />
      </Card>
    </Surface>
  );
}