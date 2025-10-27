import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { List, Checkbox, Text, useTheme, Surface, Button, Portal, Modal, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../constants/navigation'; // navigate to habits page

import { Habit, HabitWithCompletion } from '../constants/interfaces'
import { globalStyles } from '../constants/globalStyles';
import { completeHabit, uncompleteHabit, getHabitsForDay } from '../api/habitsApi';
import { useUser } from "@/constants/UserContext";


// gets data from the habit_completions table
export default function HabitsList({ date, onHabitsUpdated }: { date: string; onHabitsUpdated?: () => void })
{
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const { user } = useUser(); // Get the logged-in user

  const today = new Date().toISOString().split('T')[0];
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootTabParamList>>();

  // fetch habits for the day
  const loadHabits = async () => {
    if (!user) return; // Ensure the user is logged in
    try {
      const data = await getHabitsForDay(user.id, date);
      const transformedData = data.map((habit: HabitWithCompletion) => ({
        ...habit,
        status: habit.status ? 1 : 0, // Convert boolean to integer
      }));
      setHabits(transformedData);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  // Load habits on component mount
  useEffect(() => {
    loadHabits();
  }, []);

  // Reload data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
    }, [])
  );

  const toggleCheck = async (id: number) => {
    try {
      const habitToUpdate = habits.find((habit) => habit.habit_id === id);
      if (habitToUpdate) {
        const newStatus = habitToUpdate.status === 1 ? 0 : 1;
        if (newStatus === 1) {
          await completeHabit(id, date); // Wait for the database update to complete
        } else {
          await uncompleteHabit(id, date); // Wait for the database update to complete
        }
      }
      await loadHabits();
      // Trigger the callback after the database update is complete
      if (onHabitsUpdated) {
        onHabitsUpdated();
      }
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
      <Surface style={[globalStyles.container, { height: 250 }, { backgroundColor: theme.colors.background }]} elevation={0}>
        <Surface elevation={0} style={globalStyles.inRow}>
            <Text variant="titleMedium">Today's Tasks</Text>
            {habits.length > 0 && (
              <Text
                variant="titleLarge"
                style={{ color: completedPercentage > 80 ? 'green' : completedPercentage < 20 ? 'red' : globalStyles.yellow.color }}
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
        {habits.length > 0 ? (
          <>
          <Text
            variant="titleLarge"
            style={{ paddingLeft: 10, color: completedPercentage > 80 ? 'green' : completedPercentage < 20 ? 'red' : globalStyles.yellow.color }}
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