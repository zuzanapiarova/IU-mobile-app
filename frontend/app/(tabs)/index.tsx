import React, { useEffect, useState } from 'react';
import { Text, Card, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useUser } from '../../constants/UserContext';
import { globalStyles } from '../../constants/globalStyles';
import Loading from '@/components/Loading';
import HabitsList from '@/components/HabitsCheckList';
import StatusCalendar from '@/components/StatusCalendar';

export default function HomeScreen()
{
  const today = new Date().toISOString().split('T')[0];
  const router = useRouter();
  const theme = useTheme();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  // TODO: this can be removed ? but what about isLoading
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!user) {
          router.replace('/login');
          return;
        }
      } catch (err) {
        console.error('Error in index:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  });

  // While initializing or redirecting
  if (isLoading) 
    return <Loading />;

  // Render the main screen only if the user is logged in
  if (!user) return alert('You must be logged in!');

  // Only render actual UI after initialization
  return (
    <Surface style={[globalStyles.display, { flex: 1, justifyContent: 'flex-start', backgroundColor: theme.colors.surface}]} elevation={0}>
      <Text variant="displaySmall">
        Welcome {(user?.createdAt < today) && "back, " } {user?.name ?? 'Guest'}!
      </Text>

      <Surface style={[globalStyles.container,{flex: 1, backgroundColor: theme.colors.background }]}>
        <HabitsList date={today} />
      </Surface>

      <Card style={[globalStyles.container, {backgroundColor: theme.colors.background }]}>
        <StatusCalendar />
      </Card>
    </Surface>
  );
}