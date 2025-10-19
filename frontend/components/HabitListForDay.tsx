import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { List, Checkbox, Text, useTheme, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Habit } from '../constants/interfaces'
import { globalStyles } from '../constants/globalStyles';
import { completeHabit, uncompleteHabit, getHabitsForDay } from '../database/habitsQueries';

interface HabitListForDayProps {
    date: string; // Define the date prop type
  }
  
export default function HabitListForDay({ date }: HabitListForDayProps)
{
    const [habits, setHabits] = useState<Habit[]>([]);
    const theme = useTheme();

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
                {item.name}aaa
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

    if (habits.length === 0) {
      return (
        <Surface style={globalStyles.center} elevation={0}>
          <Text variant="displayMedium">
            No records for this day.
          </Text>
        </Surface>
      );
    }
  
    return (
        <FlatList
            data={sortedHabits}
            keyExtractor={item => item.habit_id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => 
                <View style={globalStyles.separator}/>}
        />
    );
  };