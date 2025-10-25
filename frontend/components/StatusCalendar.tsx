import React, { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme, Surface, Button, Card, Modal, Portal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { getCompletionPercentageForDay } from './OverViewCalculations';
import { globalStyles } from '../constants/globalStyles'
import HabitsList from './HabitsCheckList';

export default function StatusCalendar() {
    const theme = useTheme();
    const today = new Date().toISOString().split('T')[0];
    const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month (1-based)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year
    const [isModalVisible, setModalVisible] = useState(false);
  
    // Generate dot color for the given month and year to be used as marked dates in Calendar component
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
  
    // Reset to the current month and year when the screen is focused
    useFocusEffect(
      React.useCallback(() => {
        const currentMonth = new Date().getMonth() + 1; // Current month (1-based)
        const currentYear = new Date().getFullYear(); // Current year
        setSelectedMonth(currentMonth); // Update selectedMonth to the current month
        setSelectedYear(currentYear); // Update selectedYear to the current year
        generateMarkedDates(currentYear, currentMonth); // Generate marked dates for the current month
      }, [])
    );
  
    // Handle date selection
    const handleDateSelect = async (date: string) => {
      if (date === today) return;
      setSelectedDate(date);
      setModalVisible(true);
    };
  
    // Update the dot color for the selected date
    const updateSelectedDateDotColor = async (date: string) => {
      const percentage = await getCompletionPercentageForDay(date);
  
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
          // current={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`} // Dynamically set the displayed month and year
          markedDates={{
            ...markedDates,
            [today]: { selected: true }, // Highlight today
          }}
          onDayPress={(day) => handleDateSelect(day.dateString)} // Handle date selection
          onMonthChange={(month) => {
            console.log(`Month changed to year: ${month.year}, month: ${month.month}`);
            setSelectedMonth(month.month); // Update the selected month
            setSelectedYear(month.year); // Update the selected year
            generateMarkedDates(month.year, month.month); // Generate marked dates for the new month
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
              style={{ maxHeight: '80%', paddingTop: 30, paddingBottom: 30 }}
              contentContainerStyle={[
                globalStyles.modal,
                { paddingTop: 30, paddingBottom: 30, display: 'flex', flexDirection: 'column' },
              ]}
            >
              <HabitsList
                date={selectedDate!}
                onHabitsUpdated={() => {
                  if (selectedDate) updateSelectedDateDotColor(selectedDate); // Update dot color after habits are updated
                }}
              />
              <Button
                mode="contained"
                onPress={() => setModalVisible(false)}
                style={[globalStyles.closeButton]}
              >
                Close
              </Button>
            </Modal>
          </Portal>
        )}
      </>
    );
  }