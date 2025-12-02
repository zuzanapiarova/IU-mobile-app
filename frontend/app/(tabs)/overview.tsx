import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, Surface, SegmentedButtons } from 'react-native-paper';
import { globalStyles } from '../../constants/globalStyles';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../constants/UserContext'
import { completeHabit, getHabitsForDay, getHabitStreak } from '../../api/habitsApi'
import { Habit } from '@/constants/interfaces';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OverviewCard from '@/components/OverviewCard';
import PeriodGraph from '../../components/PeriodGraph'
import Loading from '@/components/Loading';
import { useConnection } from '@/constants/ConnectionContext';

// interfaces used during calculations
interface HabitById {
  habitId: number;
  name: string;
  streak: number;
  totalCompletions: number;
  maxCompletions: number;
  completionPercentage: number;
}

interface HabitByDate {
  date: string;
  completionPercentage: number;
  habits: Habit[];
}

interface GraphDataPoint {
  value: number;
  dataPointColor: string;
  dataPointRadius: number;
  label: string;
}

const today = new Date().toISOString().split('T')[0];

// FUNCTIONS

// get date span for period selected - current week/month/year
const calculateDateSpan = (dateString: string, period: 'week' | 'month' | 'year') => {
  const date = new Date(dateString);

  let start: string;
  let end: string;

  // calculate start and end date of the selected period
  if (period === 'week') {
    const dayOfWeek = (date.getDay() + 6) % 7; // adjust Sunday (0) to be the last day of the week
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    start = startDate.toISOString().split('T')[0];
    end = endDate.toISOString().split('T')[0];
  } else if (period === 'year') {
    const startDate = new Date(date.getFullYear(), 0, 2);
    const endDate = new Date(date.getFullYear(), 11, 32);
    start = startDate.toISOString().split('T')[0];
    end = endDate.toISOString().split('T')[0];
  } else {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 2);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
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

  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1))
    dates.push(new Date(d).toISOString().split('T')[0]);
  return dates;
};

// fetch array of habits for dates in the selected period
const fetchHabitsForPeriod = async (userId: number, dates: string[]) => {
  const allHabits: Habit[] = [];

  for (const date of dates) {
    try {
      const habitsForDay = await getHabitsForDay(userId, true, date);
      allHabits.push(...habitsForDay);
    } catch (error) {
      throw error;
    }
  }

  return allHabits;
};

// process habits into object and group by their id, and calculate information about each habit id in the object (completions, percentage, ...)
const getHabitsById = async (userId: number, startsAfterDate: string, habits: any[], periodLength: number): Promise<HabitById[]>  => {
  const groupedHabits: Record<number, Habit[]> = {};
  
  habits.forEach((habit) => {
    if (!groupedHabits[habit.habit_id])
      groupedHabits[habit.habit_id] = [];
    groupedHabits[habit.habit_id].push(habit);
  });

  // calculate total completions for each habit and fetch its streak
  const habitsArr = await Promise.all(Object.entries(groupedHabits).map(async ([habitId, habitGroup]) => {
    habitGroup.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let totalCompletions = 0;
    let maxCompletions = 0;
    let completionPercentage = 0;

    for (const habit of habitGroup) {
      if (habit.current == 1) // if habit is current, predict it will be current for the entire period 
        maxCompletions = periodLength;
      else  // if habit is not current(=deleted), calculate how many days it was recorded in this period, fulfilled or not
        maxCompletions++;
      if (habit.status == 1)
        totalCompletions++;
    }

    if (totalCompletions > 0 && maxCompletions > 0)
      completionPercentage = Math.round((totalCompletions / maxCompletions) * 100);

    // fetch the longest current streak for each habit
    try {
      const streakData = await getHabitStreak(userId, parseInt(habitId), startsAfterDate); 
      return {
        habitId: parseInt(habitId),
        name: habitGroup[0].name,
        streak: streakData.streak,
        totalCompletions,
        maxCompletions,
        completionPercentage
      };
    } catch (error) {
      throw error;
    }
    })
  );
  habitsArr.sort((a, b) => b.streak - a.streak);

  return habitsArr;
};

// processed habits into object and group by their date, and calculate values for each date (percentage)
const getHabitsByDate = (dates: string[], unprocessedHabits: Habit[]): HabitByDate[] => {
  const groupedHabits: Record<string, Habit[]> = {}; 

  dates.forEach((date) => {
    groupedHabits[date] = [];
  });

  unprocessedHabits.forEach((habit) => {
    const date = new Date(habit.date).toISOString().split('T')[0]; // normalize to YYYY-MM-DD
    if (groupedHabits[date]) {
      groupedHabits[date].push(habit);
    }
  });
  
  // calculate completion percentage for each date
  const habitsByDate = Object.entries(groupedHabits).map(([date, habits]) => {
    let totalCompletions = 0;
    let maxCompletions = habits.length;
    
    habits.forEach((habit) => {
      if (habit.status == 1)
        totalCompletions++;
    });
    
    const completionPercentage = maxCompletions > 0 ? Math.round((totalCompletions / maxCompletions) * 100) : 0;

    return {
      date,
      completionPercentage,
      habits
    };
  });

  return habitsByDate;
};

// generate data from habitdByDate to be visualized in the graph
const getGraphData = (habitsByDate: HabitByDate[], minCompletion: number, maxCompletion: number, userSignupDate: string): GraphDataPoint[] => {
  const length = habitsByDate.length;
  const interval = length > 31 ? length - 15 : length > 8 ? 2 : 1;

  const data = habitsByDate.map((item, index) => {
    const parsedDate = new Date(item.date);
    const day = parsedDate.toLocaleDateString('en-GB', { day: '2-digit' });
    const month = parsedDate.toLocaleDateString('en-GB', { month: '2-digit' });
    const isFutureDate = parsedDate.toISOString().split('T')[0] > today;
    const isPastDate = parsedDate.toISOString().split('T')[0] < new Date(userSignupDate).toISOString().split('T')[0];

    // determine the color based on completionPercentage or date 
    let dataPointColor = globalStyles.green.color;
    if (item.completionPercentage < maxCompletion)
      dataPointColor = globalStyles.yellow.color;
    if (item.completionPercentage < minCompletion)
      dataPointColor = globalStyles.red.color;
    const dataPointRadius = (isFutureDate || isPastDate) ? 0 : 3; // no dot for future dates 

    return {
      value: (isFutureDate || isPastDate) ? 0 : item.completionPercentage,
      dataPointColor,
      dataPointRadius,
      label: ((length > 31) ? '' : (length > 7) ? (index % interval === 0 ? day : '') : (`${day}/${month}`))
    };
  });

  return data;
};

export default function OverviewScreen()
{
  const theme = useTheme();
  const { user } = useUser();
  const { setBannerMessage } = useConnection();
  const [loading, setLoading] = useState(false);
  const [dateSpan, setDateSpan] = useState(calculateDateSpan(today, 'month'));
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [habitsById, setHabitsById] = useState<any[]>([]);
  const [habitsByDate, setHabitsByDate] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [isStatisticsExpanded, setIsStatisticsExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // load and process all data
  const prepareData = useCallback(async () => {
    try {
      if (!user) throw new Error('You must be logged in!');
      setLoading(true);
      const dates = generateDatesInRange(dateSpan.start, dateSpan.end);
      const fetchedHabits = await fetchHabitsForPeriod(user.id, dates);
      const processedHabitsById = await getHabitsById(user.id, dateSpan.start, fetchedHabits, dates.length );
      setHabitsById(processedHabitsById);
      const processedHabitsByDate = getHabitsByDate(dates, fetchedHabits);
      const graphDataTemp = getGraphData(processedHabitsByDate, user.failureLimit, user.successLimit,user.createdAt);
      setHabitsByDate(processedHabitsByDate);
      setGraphData(graphDataTemp);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error) setBannerMessage(error.message);
      else setBannerMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateSpan, user]);

  // fetch habits when the screen is focused or dateSpan changes
  useEffect(() => {
    prepareData();
  }, [prepareData]);

  // recalculate data when the screen is focused again
  useFocusEffect(
    useCallback(() => {
      prepareData();
    }, [prepareData])
  );

  const toggleStatistics = () => {
    setIsStatisticsExpanded((prev) => !prev);
  };

  if (!user) return setBannerMessage('You must be logged in!');

  if (loading) return <Loading/>;

  return (
    <ScrollView style={{backgroundColor: theme.colors.surface}}>
    <Surface style={ [globalStyles.display, {backgroundColor: theme.colors.surface}] } elevation={0}>
      <Text variant='displaySmall'>
        Overview
      </Text>
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
        <Text style={ { textAlign: 'center'}}>
          Displaying habit information for period
        </Text>
        <Text variant="titleMedium" style={ { textAlign: 'center', marginVertical: 8 }}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.start))} - {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateSpan.end))}</Text>
      </Card>

      {/* line graph with completions for the current selected period */}
        <PeriodGraph key={refreshKey} habitsByDate={habitsByDate} graphData={graphData} userSignupDate={user.createdAt} />
      
      {/* Cards with overview of streaks and completions */}
      {habitsById.length > 0 && (
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
          <MaterialCommunityIcons color={theme.colors.primary} style={{marginLeft: 6}} size={28}
            name={isStatisticsExpanded ? 'chevron-up' : 'chevron-down'}
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
  )
};


