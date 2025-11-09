import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme, Surface, Button, Card, Modal, Portal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { getCompletionPercentageForDay } from './OverViewCalculations';
import { globalStyles } from '../constants/globalStyles'
import HabitsList from './HabitsCheckList';
import { useUser } from "@/constants/UserContext"; // Import the UserContext

export default function StatusCalendar() {
  const theme = useTheme();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1; // Current month (1-based)
  const currentYear = new Date().getFullYear(); // Current year

  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); // Current month (1-based)
  const [selectedYear, setSelectedYear] = useState(currentYear); // Current year
  const [isModalVisible, setModalVisible] = useState(false);
  
  const { user } = useUser(); // Access user data and actions from context
  if (!user) return;
  const createdAtDate = new Date(user.createdAt);
  const createdAtYear = createdAtDate.getFullYear();
  const createdAtMonth = createdAtDate.getMonth() + 1;
  const createdAtDay = createdAtDate.getDate();

    // Generate dot color for the given month and year to be used as marked dates in Calendar component
    const generateMarkedDates = async (year: number, month: number) => {
      // Always reset before generating (so UI stays consistent)
      setMarkedDates({});
      // Do not generate dots for dates when user was not using the app or in the future
      if (year < createdAtYear || year > new Date().getFullYear()) return;
      if (
        (year <= createdAtYear && month < createdAtMonth) ||
        (year === new Date().getFullYear() && month > new Date().getMonth() + 1)
      )
      return;
      
      let daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
      if (month === new Date(today).getMonth() + 1) daysInMonth = new Date(today).getDate();
      const newMarkedDates: { [key: string]: any } = {};
      
      for (let day = 1; day <= daysInMonth; day++) {
        if (month === createdAtMonth && year === createdAtYear && day < createdAtDay) continue; // Do not generate for dates before the user started using the app
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const percentage = await getCompletionPercentageForDay(user.id, date);
        
        // Determine the dot color based on the updated success and failure limits
        let dotColor = globalStyles.yellow.color;
        if (percentage >= user.successLimit) dotColor = globalStyles.green.color;
        else if (percentage <= user.failureLimit) dotColor = 'red';
        newMarkedDates[date] = { marked: true, dotColor };
      }
      
      // Update the state with the new marked dates
      setMarkedDates(newMarkedDates);
    };
  
    // Reset to the current month and year when the screen is focused
    useFocusEffect(
      React.useCallback(() => {
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1); // Update to the current month
        setSelectedYear(now.getFullYear()); // Update to the current year
        generateMarkedDates(now.getFullYear(), now.getMonth() + 1); // Generate marked dates for the current month
      }, [])
    );

    // Generate marked dates on the initial render
    useEffect(() => {
      generateMarkedDates(currentYear, currentMonth); // Generate marked dates for the current month
    }, []);

    // Regenerate dots when successLimit or failureLimit changes
    useEffect(() => {
      generateMarkedDates(selectedYear, selectedMonth); // Regenerate dots for the currently selected month and year
    }, [user.successLimit, user.failureLimit, user.themePreference]);

  
    // Handle date selection
    const handleDateSelect = async (date: string) => {
      if (date === today) return;
      setSelectedDate(date);
      setModalVisible(true);
    };
  
    // Update the dot color for the selected date
    const updateSelectedDateDotColor = async (date: string) => {
      const percentage = await getCompletionPercentageForDay(user.id, date);
  
      // Determine the new dot color based on the percentage
      let dotColor = globalStyles.yellow.color;
      if (percentage >= user.successLimit) dotColor = 'green';
      else if (percentage <= user.failureLimit) dotColor = 'red';
  
      // Update the markedDates state for the selected date
      setMarkedDates((prevMarkedDates) => {
        const updatedMarkedDates = {
          ...prevMarkedDates,
          [date]: { ...prevMarkedDates[date], dotColor },
        };
        return updatedMarkedDates;
      });
    };
    // console.log("marked days: ");
    // console.log(markedDates);
    return (
      <>
        <Calendar
          key={`${selectedYear}-${selectedMonth}-${user.themePreference}`} // Force re-render when month or year changes
          current={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`} // Dynamically set the displayed month and year
           markedDates={{
            ...markedDates,
            [today]: { selected: true }, // Highlight today
          }}
          onDayPress={(day) => handleDateSelect(day.dateString)} // Handle date selection
          onMonthChange={(month) => {
            setSelectedMonth(month.month); // Update the selected month
            setSelectedYear(month.year); // Update the selected year
            generateMarkedDates(month.year, month.month); // Generate marked dates for the new month
          }}
          style={{ borderRadius: 8 }}
          theme={{
            monthTextColor: theme.colors.primary,
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