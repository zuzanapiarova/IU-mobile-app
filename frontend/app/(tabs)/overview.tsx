import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity,ScrollView  } from 'react-native';
import { Text, Card, useTheme, Button, Portal, Surface, List, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { globalStyles } from '../../constants/globalStyles';
import { PieChart } from 'react-native-chart-kit'; // Install this library
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
// import { VictoryBar, VictoryChart, VictoryTheme } from 'victory-native';
import { useUser } from '../../constants/UserContext'
import { getHabitsForDay, getHabitStreak } from '../../api/habitsApi'

// functions:

// calculate date span for period selected
const calculateDateSpan = (dateString: string, period: 'week' | 'month' | 'year') => {
  const date = new Date(dateString);

  let start: string;
  let end: string;

  if (period === 'week') {
    // Calculate start and end of the week (Monday as the first day)
    const dayOfWeek = (date.getDay() + 6) % 7; // Adjust Sunday (0) to be the last day of the week
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek); // Go back to the start of the week (Monday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Go forward to the end of the week (Sunday)

    start = startDate.toISOString().split('T')[0];
    end = endDate.toISOString().split('T')[0];
  } else if (period === 'year') {
    // Calculate the start and end of the year
    const startDate = new Date(date.getFullYear(), 0, 2); // January 1st
    const endDate = new Date(date.getFullYear(), 11, 32); // December 31st

    start = startDate.toISOString().split('T')[0];
    end = endDate.toISOString().split('T')[0];
  } else {
    // Default to month
    const startDate = new Date(date.getFullYear(), date.getMonth(), 2); // First day of the month
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1); // Last day of the month

    start = startDate.toISOString().split('T')[0];
    end = endDate.toISOString().split('T')[0];
  }

  return { start, end };
};

// generate array of dates in selected period
const generateDatesInRange = (start: string, end: string): string[] => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dates: string[] = [];

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split('T')[0]);
  }

  return dates;
};

// fetch array of habits for dates in the selected period
const fetchHabitsForPeriod = async (userId: number, dateSpan: { start: string; end: string }) => {
  const dates = generateDatesInRange(dateSpan.start, dateSpan.end);
  const allHabits: any[] = [];

  for (const date of dates) {
    try {
      const habitsForDay = await getHabitsForDay(userId, true, date); // API call for each day
      allHabits.push(...habitsForDay); // Append habits for the day to the array
    } catch (error) {
      console.error(`Error fetching habits for ${date}:`, error);
    }
  }

  return allHabits;
};

// streaks - longest and shortest
const groupAndSortHabitsByStreak = async (userId: number, startsAfterDate: string, habits: any[]) => {
  const groupedHabits: Record<number, any[]> = {};
  // Group habits by habitId
  habits.forEach((habit) => {
    if (!groupedHabits[habit.habit_id]) {
      groupedHabits[habit.habit_id] = [];
    }
    groupedHabits[habit.habit_id].push(habit);
  });

  // Calculate total completions for each habit and fetch its streak
  const streaks = await Promise.all(
    Object.entries(groupedHabits).map(async ([habitId, habitGroup]) => {
      // Sort the habitGroup by date in descending order
      habitGroup.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let totalCompletions = 0;

      for (const habit of habitGroup) {
        if (habit.status === true) {
          totalCompletions++; // Count completed days
        }
      }

      // Fetch the longest streak for the habit using the API
      const streakData = await getHabitStreak(userId, parseInt(habitId), startsAfterDate); // ! error in this unction 
      return {
        habitId: parseInt(habitId),
        name: habitGroup[0].name, // Use the name from the first habit in the group
        streak: streakData.streak, // Use the streak from the API response
        totalCompletions,
      };
    })
  );
  // Sort habits by longest streak in descending order
  streaks.sort((a, b) => b.streak - a.streak);

  return streaks;
};

// percentages for weeks and month and comparison against previous 
const calculateCompletionPercentages = () => {
  
  // getCompletionPercentageForDay();
};

// overview graphs with date/week/month pickers

export default function OverviewScreen()
{
  const theme = useTheme();
  const today = new Date().toISOString().split('T')[0];
  const { user } = useUser();
  const [dateSpan, setDateSpan] = useState(calculateDateSpan(today, 'month'));
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [habits, setHabits] = useState<any[]>([]); // State to store fetched habits
  const [loading, setLoading] = useState(false);
  const [streaks, setStreaks] = useState<any[]>([]);

  // fetch habits when the screen is focused or dateSpan changes

  // Function to load data
  const loadData = async () => {
    if (!user) return alert('User must be logged in');
    setLoading(true);
    try {
      const fetchedHabits = await fetchHabitsForPeriod(user.id, dateSpan);
      setHabits(fetchedHabits); // Store fetched habits in state
      const calculatedStreaks = await groupAndSortHabitsByStreak(user.id, dateSpan.start, fetchedHabits);
      setStreaks(calculatedStreaks);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch habits when the screen is focused or dateSpan changes
  useEffect(() => {
    loadData();
  }, [dateSpan]);

  // Recalculate data when the screen is focused again
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dateSpan]) // Dependency array ensures it uses the latest dateSpan
  );

  if (!user) return alert('You must be logged in!');

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator animating size="large" color={theme.colors.primary} />
      </View>
    );
  }

return (
  <ScrollView>
  <Surface style={ [globalStyles.display, {backgroundColor: theme.colors.surface}] } elevation={0}>
    <Text variant='displaySmall'>Overview</Text>
    <Card style={[globalStyles.card, {backgroundColor: theme.colors.background }]}>
      <Text variant="titleMedium" style={ { textAlign: 'center',marginVertical: 16 }}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.start))} - {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.end))}</Text>
      <SegmentedButtons
        value={selectedPeriod}
        onValueChange={(value) => {
          setSelectedPeriod(value as 'week' | 'month' | 'year'); // Update the selected period
          setDateSpan(calculateDateSpan(today, value as 'week' | 'month' | 'year')); // Update the date span
        }}
        buttons={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month'},
          { value: 'year', label: 'Year'},
        ]}
        style={[globalStyles.segmentedButtons, globalStyles.inputCard]}
      />
      {/* Render grouped habits */}
      {streaks.length > 0 ? (
            streaks.map((habit) => (
              <View key={habit.habitId} style={{ marginVertical: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{habit.name}</Text>
                <Text>Longest Streak: {habit.streak}</Text>
                <Text>Total Completions: {habit.totalCompletions}</Text>
              </View>
            ))
          ) : (
            <Text>No habits found for the selected period.</Text>
          )}
  </Card>
  </Surface>
  </ScrollView>
)};


