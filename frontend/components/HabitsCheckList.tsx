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

import { logDatabaseContents } from '../database/db'
import { getAllHabits, getCompletedHabitsForDay, completeHabit, uncompleteHabit } from '../database/habitsQueries';

export default function HabitsList()
{
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkedHabits, setCheckedHabits] = useState<number[]>([]);

  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootTabParamList>>();
  
  const loadHabits = async () => {
    const data = await getAllHabits(); // Fetch all habits
    const completedHabitIds = await getCompletedHabitsForDay(); // Fetch completed habits for today
    setHabits(data);
    setCheckedHabits(completedHabitIds); // Update the checked habits
  };

  // Reload data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
    }, [])
  );

  async function toggleCheck(id: number) {
    if (checkedHabits.includes(id)) {
      // Uncheck the habit
      await uncompleteHabit(id); // Call the function to mark the habit as incomplete in the database
      setCheckedHabits((prev) => prev.filter((habitId) => habitId !== id));
    } else {
      // Check the habit
      await completeHabit(id); // Call the function to mark the habit as complete in the database
      setCheckedHabits((prev) => [...prev, id]);
    }
    // await logDatabaseContents();
  }

  const completedPercentage = habits.length > 0 
  ? Math.round((checkedHabits.length / habits.length) * 100) 
  : 0;

  const sortedHabits = [
    ...habits.filter(h => !checkedHabits.includes(h.id)),
    ...habits.filter(h => checkedHabits.includes(h.id)),
  ];

  const renderItem = ({ item }: { item: Habit }) => {
    const isChecked = checkedHabits.includes(item.id);
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
          <TouchableOpacity onPress={() => toggleCheck(item.id)}>
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
        <Text variant="titleMedium">
          Today's Tasks
        </Text>
          {habits.length > 0 && (
            <Text variant='titleLarge' style={{ color: completedPercentage === 100 ? 'green' : completedPercentage > 0 ? globalStyles.yellow.color : 'red',
            }}>
              {completedPercentage}%
            </Text> )}
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
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => 
            <View style={globalStyles.separator} 
          />}
        />
      )}
    </Surface>
  );
}