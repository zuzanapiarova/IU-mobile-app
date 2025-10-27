import React from 'react';
import { Text, Card, Surface, useTheme } from 'react-native-paper';
import { useUser } from '../../constants/UserContext';

import HabitsList from '@/components/HabitsCheckList'
import StatusCalendar from '@/components/StatusCalendar';

import { globalStyles } from '../../constants/globalStyles';

export default function HomeScreen()
{
  const today = new Date().toISOString().split('T')[0];
  const theme = useTheme();

  const { user } = useUser();

  return (
    <Surface
      style={[globalStyles.display, { backgroundColor: theme.colors.surface, flex: 1 }]}
      elevation={0}
    >
      <Text variant="displaySmall">
        Welcome back, {user?.name ?? 'Guest'}!
      </Text>
      <Surface style={[globalStyles.container, { height: 300 }, { backgroundColor: theme.colors.background }]}>
        <HabitsList date={today}/>
      </Surface>
      <Card style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
        <StatusCalendar />
      </Card>
    </Surface>
  );
}