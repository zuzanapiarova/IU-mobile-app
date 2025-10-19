import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { List, Checkbox, Text, useTheme, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../constants/navigation'; // navigate to habits page

import { Habit } from '../constants/interfaces'
import { globalStyles } from '../constants/globalStyles';
import { completeHabit, uncompleteHabit, getHabitsForDay } from '../database/habitsQueries';
import { logDatabaseContents } from '@/database/db';

interface HabitListForDayProps {
  date: string; // Define the date prop type
}

// gets data from the habit_completions table
export default function HabitsList({ date }: HabitListForDayProps)
{
  const [habits, setHabits] = useState<Habit[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootTabParamList>>();

  // fetch habits for the day
  const loadHabits = async () => {
    try {
      const data = await getHabitsForDay(date);
      setHabits(data);
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

  // Toggle habit completion
  const toggleCheck = async (id: number) => {
    try {
      const updatedHabits = habits.map((habit) => {
        if (habit.habit_id === id) {
          const newStatus = habit.status === 1 ? 0 : 1; // Toggle status
          if (newStatus === 1) {
            completeHabit(id, date); // Mark as completed in the database
          } else {
            uncompleteHabit(id, date); // Mark as uncompleted in the database
          }
          return { ...habit, status: newStatus }; // Update the habit's status
        }
        return habit;
      });
      setHabits(updatedHabits); // Update the habits state
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const completedPercentage =
    habits.length > 0
      ? Math.round((habits.filter((habit) => habit.status === 1).length / habits.length) * 100)
      : 0;

  // sort habits so unfinished ar ealways on top 
  const sortedHabits = [
    ...habits.filter((h) => h.status === 0),
    ...habits.filter((h) => h.status === 1),
  ];

  const renderItem = ({ item }: { item: Habit }) => {
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

  return (
    <Surface style={[globalStyles.container, { height: 250 }, { backgroundColor: theme.colors.background }]} elevation={0}>
      <Surface elevation={0} style={globalStyles.inRow}>
        {date === today ? (
          <>
            <Text variant="titleMedium">Today's Tasks</Text>
            {habits.length > 0 && (
              <Text variant="titleLarge" style={{ color: completedPercentage === 100 ? 'green' : completedPercentage > 0 ? globalStyles.yellow.color : 'red' }}>
                {completedPercentage}%
              </Text>
            )}
          </>
          ) : (
          <>
            <Text variant="titleSmall">Tasks for {date}</Text>
            {habits.length > 0 && (
              <Text variant="titleSmall" style={{ color: completedPercentage === 100 ? 'green' : completedPercentage > 0 ? globalStyles.yellow.color: 'red'}}>
                {completedPercentage}%
              </Text>
            )}
          </>
        )}
      </Surface>
      
      {habits.length === 0 ? (
        <Surface style={globalStyles.center} elevation={0}>
          {date === today ? (
            <Button mode="contained" onPress={() => navigation.navigate('habits')}>
              Add Habit
            </Button>
          ) : (
            <Text>No records for this day.</Text>
          )}
        </Surface>
      ) : (
        <FlatList
          data={sortedHabits}
          keyExtractor={item => item.habit_id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => 
            <View style={globalStyles.separator} 
          />}
        />
      )}
    </Surface>
  );
}