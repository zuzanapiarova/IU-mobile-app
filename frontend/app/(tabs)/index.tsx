import React, { useEffect, useState } from 'react';
import { Text, Card, Surface, useTheme } from 'react-native-paper';

import { getUserByUsername } from '../../database/userQueries';
import HabitsList from '@/components/HabitsCheckList'
import StatusCalendar from '@/components/StatusCalendar';
import { Habit } from '../../constants/interfaces'
import { User } from '../../constants/interfaces'

import { globalStyles } from '../../constants/globalStyles';

export default function HomeScreen()
{
  const [userName, setUserName] = useState<User | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const theme = useTheme();

  useEffect(() => {
    // todo: use setUsername to use data from react context
  }, []);

  return (
    <Surface
      style={[globalStyles.display, { backgroundColor: theme.colors.surface, flex: 1 }]}
      elevation={0}
    >
      <Text variant="displaySmall">
        Welcome back, {userName?.name ?? 'Guest'}!
      </Text>
      <Surface
        style={[globalStyles.container, { height: 300 }, { backgroundColor: theme.colors.background }]}
      >
        <HabitsList date={today}/>
      </Surface>
      <Card style={[globalStyles.container, { backgroundColor: theme.colors.background }]}>
        <StatusCalendar />
      </Card>
    </Surface>
  );
}