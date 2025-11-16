import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, Button, Portal, Surface, List, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { globalStyles } from '../../constants/globalStyles';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../constants/UserContext'
import { getHabitsForDay, getHabitStreak } from '../../api/habitsApi'
import { Habit } from '@/constants/interfaces';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OverviewCard from '@/components/OverviewCard';
import PeriodGraph from '../../components/PeriodGraph'

const today = new Date().toISOString().split('T')[0];

// FUNCTIONS

// get date span for period selected - current week/month/year
const calculateDateSpan = (dateString: string, period: 'week' | 'month' | 'year') => {
  const date = new Date(dateString);

  let start: string;
  let end: string;

  if (period === 'week') {
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
const fetchHabitsForPeriod = async (userId: number, dates: string[]) => {
  const allHabits: Habit[] = [];

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

// process habits into object and group by their id, and calculate information about each habit id in the period (completions, percentage, ...)
const getHabitsById = async (userId: number, startsAfterDate: string, habits: any[], periodLength: number)  => {
  const groupedHabits: Record<number, any[]> = {}; // map habit id to array of habits with that id for multiple days 
  // Group habits by habitId and store it in object with keys being ids of habits and values array of all habit records with that id 
  habits.forEach((habit) => {
    if (!groupedHabits[habit.habit_id]) {
      groupedHabits[habit.habit_id] = [];
    }
    groupedHabits[habit.habit_id].push(habit);
  });

  // Calculate total completions for each habit and fetch its streak
  const habitsArr = await Promise.all(
    Object.entries(groupedHabits).map(async ([habitId, habitGroup]) => {
      // Sort the habitGroup by date in descending order
      habitGroup.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let totalCompletions = 0;
      let maxCompletions = 0;
      let completionPercentage = 0;

      for (const habit of habitGroup) {
        if (habit.current === true) // if habit is current, suppose it will be current for the entire period 
          maxCompletions = periodLength; // count days at which the habit was supposed to be completed
        else  // if habit is not current, calculate how many days it was recorded in this period, fulfilled or not
          maxCompletions++;
        if (habit.status === true)
          totalCompletions++; // Count completed days
      }

      if (totalCompletions > 0 && maxCompletions > 0)
        completionPercentage = Math.round((totalCompletions / maxCompletions) * 100);

      // Fetch the longest streak for the habit using the API
      const streakData = await getHabitStreak(userId, parseInt(habitId), startsAfterDate); 
      return {
        habitId: parseInt(habitId),
        name: habitGroup[0].name, // Use the name from the first habit in the group
        streak: streakData.streak, // Use the streak from the API response
        totalCompletions,
        maxCompletions,
        completionPercentage
      };
    })
  );
  // Sort habits by longest streak in descending order
  habitsArr.sort((a, b) => b.streak - a.streak);

  return habitsArr;
};

// takes processed habits for selected period with their percentage, streak, and completion count
const getHabitsByDate = (dates: string[], unprocessedHabits: any[]) => {
  const groupedHabits: Record<string, any[]> = {}; // Object with keys as dates and values as arrays of habits for that date

  // Initialize the object with empty arrays for each date
  dates.forEach((date) => {
    groupedHabits[date] = [];
  });

  // Group habits by their date
  unprocessedHabits.forEach((habit) => {
    const date = habit.date;
    if (groupedHabits[date]) {
      groupedHabits[date].push(habit);
    }
  });

  // Calculate completion percentage for each date
  const habitsByDate = Object.entries(groupedHabits).map(([date, habits]) => {
    let totalCompletions = 0;
    let maxCompletions = habits.length; // Total habits for the day

    habits.forEach((habit) => {
      if (habit.status === true)
        totalCompletions++; // Count completed habits
    });

    const completionPercentage = maxCompletions > 0 ? Math.round((totalCompletions / maxCompletions) * 100) : 0;

    return {
      date,
      habits,
      completionPercentage
    };
  });

  return habitsByDate;
};

const getGraphData = (habitsByDate: any[], minCompletion: number, maxCompletion: number, userSignupDate: string) => {
  //considered making it shorted for the year but the values are not valid then - they might have some 100 days but it willnot be visible 
  // if (habitsByDate.length > 31) {
  //   habitsByDate = habitsByDate.filter((item) => {
  //     const day = new Date(item.date).getDate();
  //     return day === 1 || day === 15; // Keep only the 1st and 15th
  //   });
  // }
  const data = habitsByDate.map((item, index) => {
    const isFutureDate = item.date > today; // Check if the date is in the future
    const isPastDate = item.date < userSignupDate;

    // Determine the color based on completionPercentage or date 
    let dataPointColor = globalStyles.green.color; // Default color
    if (item.completionPercentage < maxCompletion)
      dataPointColor = globalStyles.yellow.color;
    if (item.completionPercentage < minCompletion)
      dataPointColor = globalStyles.red.color;
    if (isFutureDate || isPastDate)
      dataPointColor = 'gray';
    const dataPointRadius = isFutureDate ? 0 : 3; // no dot for future dates 


    return {
      value: isFutureDate ? 0 : item.completionPercentage, // Set value to null for future dates
      // label: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }), // x-axis: formatted date
      // index, // Keep track of the index for filtering
      dataPointColor, // Add the color for the data point
      dataPointRadius, // Add the size for the data point
    };
  });
  return data;

  // Filter labels based on the length of the data
  // const labelInterval = data.length > 31 ? 30 : data.length > 7 ? 7 : 1;
  // return data.map((item) => ({
  //   ...item,
  //   label: item.index % labelInterval === 0 ? item.label : '', // Show label only for specific intervals
  // }));
};

export default function OverviewScreen()
{
  const theme = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [dateSpan, setDateSpan] = useState(calculateDateSpan(today, 'month')); // {start: x, end: y}
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [habitsById, setHabitsById] = useState<any[]>([]); // State to store fetched habits
  const [habitsByDate, setHabitsByDate] = useState<any[]>([]); // State to store fetched habits
  const [graphData, setGraphData] = useState<any[]>([]);
  const [isStatisticsExpanded, setIsStatisticsExpanded] = useState(false); // State to toggle statistics visibility

  // Function to load data
  const loadData = async () => {
    if (!user) return alert('User must be logged in');
    setLoading(true);
    try {
      // fetch from database according to selected period 
      const dates = generateDatesInRange(dateSpan.start, dateSpan.end);
      const fetchedHabits = await fetchHabitsForPeriod(user.id, dates);
      // create object of habits grouped by id 
      const processedHabitsById = await getHabitsById(user.id, dateSpan.start, fetchedHabits, dates.length );
      setHabitsById(processedHabitsById);
      // create object of habits grouped by date
      const processedHabitsByDate = getHabitsByDate(dates, fetchedHabits);
      // data for the graph
      const graphDataTemp = getGraphData(processedHabitsByDate, user.failureLimit, user.successLimit,user.createdAt);
      setHabitsByDate(processedHabitsByDate);
      setGraphData(graphDataTemp);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch habits when the screen is focused or dateSpan changes
  useEffect(() => {
    loadData();
  }, [dateSpan, user]);

  // Recalculate data when the screen is focused again
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dateSpan]) // Dependency array ensures it uses the latest dateSpan
  );

  const toggleStatistics = () => {
    setIsStatisticsExpanded((prev) => !prev);
  };

  if (!user) return alert('You must be logged in!');

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator animating size="large" color={theme.colors.primary} />
      </View>
    );
  }

return (
  <ScrollView style={{backgroundColor: theme.colors.surface}}>
  <Surface style={ [globalStyles.display, {backgroundColor: theme.colors.surface}] } elevation={0}>
    <Text variant='displaySmall'>Overview</Text>
    <Card style={[globalStyles.card, {backgroundColor: theme.colors.background }]}>
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
        style={[globalStyles.segmentedButtons, globalStyles.inputCard, {marginTop: 8}]}
      />  
      <Text style={ { textAlign: 'center'}}>Displaying habit information for period</Text>
      <Text variant="titleMedium" style={ { textAlign: 'center',marginVertical: 8 }}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.start))} - {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.end))}</Text>
      
    </Card>

    {/* line graph with completions for the current selected period */}
    <PeriodGraph habitsByDate={habitsByDate} graphData={graphData} />

    {/* Cards with overview of streaks and completions */}
    {habitsById.length > 0 ? (
    <Surface elevation={0}>
      <OverviewCard title={'Longest Streak'}
        habitNames={habitsById
          .filter((habit) => habit.streak === Math.max(...habitsById.map((h) => h.streak)))
          .map((habit) => habit.name)}
        value={Math.max(...habitsById.map((habit) => habit.streak))}
        unit={'days'}
        color={theme.colors.primary}
      />

      <OverviewCard title={'Shortest Streak'}
        habitNames={habitsById
          .filter((habit) => habit.streak === Math.min(...habitsById.map((h) => h.streak)))
          .map((habit) => habit.name)}
        value={Math.min(...habitsById.map((habit) => habit.streak))}
        unit={'days'}
        color={globalStyles.red.color}
      />

      <OverviewCard title={'Most Completed'}
        habitNames={habitsById
          .filter((habit) => habit.totalCompletions === Math.max(...habitsById.map((h) => h.totalCompletions)))
          .map((habit) => habit.name)}
        value={Math.max(...habitsById.map((habit) => habit.totalCompletions))}
        unit={'done'}
        color={theme.colors.primary}
      />

      <OverviewCard title={'Least Completed'}
        habitNames={habitsById
          .filter((habit) => habit.totalCompletions === Math.min(...habitsById.map((h) => h.totalCompletions)))
          .map((habit) => habit.name)}
        value={Math.min(...habitsById.map((habit) => habit.totalCompletions))}
        unit={'done'}
        color={globalStyles.red.color}
      />
      </Surface>
  ) : (
    <Text>No habits found for the selected period.</Text>
  )}

    {/* Collapsible Statistics Section */}
    <Card style={[globalStyles.card, { backgroundColor: theme.colors.background, marginTop: 8 }]}>
      <TouchableOpacity onPress={toggleStatistics} style={{ flexDirection: 'row', alignItems: 'center', margin: 6}}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" >
            Statistics
          </Text>
          <Text>
            See completions and streaks for habits in the current period
          </Text>
        </View>
        <MaterialCommunityIcons color={theme.colors.primary} style={{marginLeft: 6}}
          name={isStatisticsExpanded ? 'chevron-up' : 'chevron-down'} size={28}
        />
      </TouchableOpacity>

      {isStatisticsExpanded && (
        <View style={{ padding: 16 }}>
          {habitsById.length > 0 ? (
            habitsById.map((habit) => (
              <View key={habit.habitId} style={{ marginVertical: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{habit.name}</Text>
                <Text>Longest Streak: {habit.streak}</Text>
                <Text>Total Completions: {habit.totalCompletions}</Text>
                <Text>Times to complete: {habit.maxCompletions}</Text>
                <Text>Completion percentage: {habit.completionPercentage}%</Text>
              </View>
            ))
          ) : (
            <Text>No habits found for the selected period.</Text>
          )}
        </View>
      )}
    </Card>
  </Surface>
  </ScrollView>
)};


