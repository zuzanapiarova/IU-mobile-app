import React, { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme, Surface, Button, Card, Modal, Portal } from 'react-native-paper';

import { getCompletionPercentageForDay } from './OverViewCalculations';
import { globalStyles } from '../constants/globalStyles'
import HabitsList from './HabitsCheckList';

export default function StatusCalendar()
{
  const theme = useTheme();
  const today = new Date().toISOString().split('T')[0];
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // generate dot color for the given month and year to be used as marked dates in Calendar component
  const generateMarkedDates = async (year: number, month: number) => {
    if (year > new Date().getFullYear() || (year === new Date().getFullYear() && month > new Date().getMonth() + 1)) return;
    let daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
    if (month === new Date(today).getMonth() + 1) daysInMonth = new Date(today).getDate();
    const newMarkedDates: { [key: string]: any } = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const percentage = await getCompletionPercentageForDay(date);
      let dotColor = globalStyles.yellow.color;
      if (percentage > 80) dotColor = 'green';
      else if (percentage < 20) dotColor = 'red';
      newMarkedDates[date] = { marked: true, dotColor };
    }
    setMarkedDates(newMarkedDates);
  };

  // Load the current month's marked dates on mount
  useEffect(() => {
    const currentDate = new Date();
    generateMarkedDates(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, []);

  // Handle date selection
  const handleDateSelect = async (date: string) => {
    if (date === today) return;
    setSelectedDate(date);
    setModalVisible(true);
  };

  // Update the dot color for the selected date
  const updateSelectedDateDotColor = async (date: string) => {
    const percentage = await getCompletionPercentageForDay( date );
    
    // Determine the new dot color based on the percentage
    let dotColor = globalStyles.yellow.color;
    if (percentage > 80) dotColor = 'green';
    else if (percentage < 20) dotColor = 'red';

    // Update the markedDates state for the selected date
    setMarkedDates((prevMarkedDates) => {
      const updatedMarkedDates = {
        ...prevMarkedDates,
        [date]: { ...prevMarkedDates[date], dotColor },
      };
      return updatedMarkedDates;
    });
  };

  return (
    <>
      <Calendar
        key={JSON.stringify(markedDates)}
        markedDates={{
          ...markedDates,
          [today]: { selected: true }, // Highlight today
        }}
        onDayPress={(day) => handleDateSelect(day.dateString)} // Handle date selection
        onMonthChange={(month) => {
          generateMarkedDates(month.year, month.month); // Update marked dates when the month changes
        }}
        style={{ borderRadius: 8 }}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          selectedDayBackgroundColor: theme.colors.primary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          arrowColor: theme.colors.secondary,
        }}
      />
      {selectedDate && ( 
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setModalVisible(false)}
          style={{ maxHeight: '80%',  paddingTop: 30, paddingBottom: 30 }}
          contentContainerStyle={[globalStyles.modal, { paddingTop: 30, paddingBottom: 30 , display: 'flex', flexDirection:'column'}]}>
            <HabitsList date={selectedDate!} 
              onHabitsUpdated={() => {
                if (selectedDate) updateSelectedDateDotColor(selectedDate); // Update dot color after habits are updated
              }}
            />
            <Button
                mode="contained"
                onPress={() => setModalVisible(false)}
                style={[globalStyles.closeButton,]}
              >
                Close
              </Button>
          </Modal>
        </Portal>
      )}
    </>
  );
}