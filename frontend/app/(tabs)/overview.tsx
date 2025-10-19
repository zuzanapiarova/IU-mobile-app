import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity  } from 'react-native';
import { Text, Card, useTheme, Button, Portal, Surface, List } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { initializeDatabase } from '../../database/db';
import { getCompletedHabitsForDay } from '../../database/habitsQueries';
import { Habit } from '../../constants/interfaces';
import { globalStyles } from '../../constants/globalStyles';
import { PieChart } from 'react-native-chart-kit'; // Install this library
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function OverviewScreen()
{
  const theme = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderHabit = ({ item }: { item: Habit & { isCompleted: boolean } }) => {
    return (
      <List.Item
        title={() => (
          <Text style={[globalStyles.habitText]}>
            {item.name}
          </Text>
        )}
        left={() => (
          <TouchableOpacity>
            <MaterialCommunityIcons
              name={item.isCompleted ? 'check-circle-outline' : 'circle-outline'}
              size={24}
              color={item.isCompleted ? 'green' : 'red'}
            />
          </TouchableOpacity>
        )}
      />
    );
  };

  const unfulfilledHabits = habits.filter((habit) => !habit.status);
  const fulfilledHabits = habits.filter((habit) => habit.status);

  const pieData = [
    {
      key: 1,
      value: fulfilledHabits.length,
      svg: { fill: theme.colors.primary },
      arc: { outerRadius: '100%', cornerRadius: 10 },
    },
    {
      key: 2,
      value: unfulfilledHabits.length,
      svg: { fill: theme.colors.error },
      arc: { outerRadius: '100%', cornerRadius: 10 },
    },
  ];

  return (
    <Surface style={ [globalStyles.display, { flex: 1}] } elevation={0}>
      <Text variant='displaySmall' style={{ textAlign: 'center'}}>Overview</Text>
      {/* Date Picker */}
      {/* <Button
        mode="outlined"
        onPress={() => setDatePickerVisible(true)}
        style={styles.datePickerButton}
      >
        {selectedDate.toDateString()}
      </Button>
      <Portal>
        <DatePickerModal
          mode="single"
          visible={isDatePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          date={selectedDate}
          locale="en"
          onConfirm={(params) => {
            if (params.date) {
              setSelectedDate(params.date); // Only set the date if it's defined
            }
            setDatePickerVisible(false);
          }}
        />
      </Portal> */}

      
      {/* Pie Chart */}
      {/* <PieChart
        data={pieData}
        width={300}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.background,
          backgroundGradientTo: theme.colors.background,
          color: (opacity = 1) => theme.colors.primary,
        }}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      /> */}

      {/* Habit List */}
      {/* <FlatList
        data={[...unfulfilledHabits, ...fulfilledHabits]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
      /> */}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  datePickerButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  list: {
    marginTop: 16,
  },
});