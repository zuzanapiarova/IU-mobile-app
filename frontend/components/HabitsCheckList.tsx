import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { List, Text, useTheme, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../constants/navigation';
import { HabitWithCompletion } from '../constants/interfaces'
import { globalStyles } from '../constants/globalStyles';
import { completeHabit, uncompleteHabit, getHabitsForDay } from '../api/habitsApi';
import { useUser } from "@/constants/UserContext";
import { useRouter } from 'expo-router';
import Loading from './Loading';

// get data from the habit_completions table to render current list of habits - either checklist of for management
export default function HabitsList({ date, onHabitsUpdated }: { date: string; onHabitsUpdated?: () => void })
{
  const today = new Date().toISOString().split('T')[0];
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootTabParamList>>();
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch habits for the day
  const loadHabits = useCallback(async () => {
    if (!user) return alert('You must be logged in!')
    try {
      const data = await getHabitsForDay(user.id, false, date);
      const transformedData = data.map((habit: HabitWithCompletion) => ({
        ...habit,
        status: habit.status ? 1 : 0,
      }));
      setHabits(transformedData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.replace('/login');
    loadHabits();
  }, [user, loadHabits, router]);

  // Load habits when component mounts or user/selected date changes
  useEffect(() => {
    loadHabits();
  }, [user, date, loadHabits]);

  // Reload data whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  // toggle habit completion or uncompletion for habit identified by id
  const toggleCheck = async (id: number) => {
    try {
      const habitToUpdate = habits.find((habit) => habit.habit_id === id);
      if (habitToUpdate) {
        const newStatus = habitToUpdate.status === 1 ? 0 : 1;
        if (newStatus === 1) {
          await completeHabit(id, date);
        } else {
          await uncompleteHabit(id, date);
        }
      }
      await loadHabits();
      if (onHabitsUpdated) onHabitsUpdated();
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };  

  const completedPercentage =
    habits.length > 0
      ? Math.round((habits.filter((habit) => habit.status === 1).length / habits.length) * 100)
      : 0;

  // sort habits so unfinished are always on top 
  const sortedHabits = [
    ...habits.filter((h) => h.status === 0),
    ...habits.filter((h) => h.status === 1),
  ];

  if (loading)
    return <Loading/>;

  if (!user) return null;

  const renderItem = ({item}: {item: HabitWithCompletion}) => {
    const isChecked = item.status === 1;
    return (
      <List.Item
        title={() => (
          <Text
            style={[
              globalStyles.habitText,
              isChecked && globalStyles.checkedText,
              { color: isChecked ? theme.colors.onSurfaceDisabled : theme.colors.onSurface },
            ]}
          >
            {item.name}
          </Text>
        )}
        left={() => (
          <TouchableOpacity onPress={() => toggleCheck(item.habit_id)}>
            <MaterialCommunityIcons
              name={isChecked ? 'check-circle-outline' : 'circle-outline'}
              size={24}
              color={isChecked ? theme.colors.primary : theme.colors.outline}
            />
          </TouchableOpacity>
        )}
      />
    );
  };

  if (date === today) {
    return (
      <Surface style={[globalStyles.container, {flex: 1, backgroundColor: theme.colors.background }]} elevation={0}>
        <Surface elevation={0} style={[globalStyles.inRow, {paddingBottom: 6}]}>
          <Text variant="titleMedium">Today&apos;s Tasks</Text>
          {habits.length > 0 && (
            <Text
              variant="titleLarge"
              style={{ color: completedPercentage >= user?.successLimit ? 'green' : completedPercentage <= user.failureLimit ? 'red' : globalStyles.yellow.color }}
            >
              {completedPercentage}%
            </Text>
          )}
        </Surface>
      
          {habits.length === 0 ? (
          <Surface style={globalStyles.center} elevation={0}>
            <Button mode="contained" onPress={() => navigation.navigate('habits')}>
              Add Habit
            </Button>
          </Surface>
        ) : (
          <FlatList
            data={sortedHabits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={globalStyles.separator} />}
          />
        )}
      </Surface>
    );
  } else {
    return (
      <Surface style={[globalStyles.card, { marginTop: 50, backgroundColor: theme.colors.background }]} elevation={0}>
          <Text variant="titleMedium" style={{padding: 10}}>Tasks for {date}</Text>
          {new Date(date).toISOString().split('T')[0] < new Date(user.createdAt).toISOString().split('T')[0] ? (
            // Render this message if the date is before the user's createdAt date
            <Text style={{ padding: 10, color: theme.colors.onSurfaceDisabled }}>
              Your account was not active on this day yet. No records saved.
            </Text>
          ) : habits.length > 0 ? (
          <>
          <Text
            variant="titleLarge"
            style={{ paddingLeft: 10, color: completedPercentage >= user.successLimit ? 'green' : completedPercentage <= user.failureLimit ? 'red' : globalStyles.yellow.color }}
          >
            {completedPercentage}%
          </Text>
          <FlatList
            data={sortedHabits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={globalStyles.separator} />}
          />
          </>
        ) : (
          <Text style={{padding: 10}}>No records for this day.</Text>
        )}
    </Surface>
  )};
};