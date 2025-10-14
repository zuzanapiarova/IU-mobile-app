import React, { useEffect, useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';
import { getCompletionPercentage } from './OverViewCalculations';
import { globalStyles } from '../constants/globalStyles'

export default function StatusCalendar() {
  const theme = useTheme();
  const today = new Date().toISOString().split('T')[0];
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  // Function to generate marked dates for the given month and year
  const generateMarkedDates = async (year: number, month: number) => {
    if (year > new Date().getFullYear() || (year === new Date().getFullYear() && month > new Date().getMonth() + 1)) return;
    let daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
    if (month === new Date(today).getMonth() + 1) daysInMonth = new Date(today).getDate();
    const newMarkedDates: { [key: string]: any } = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const [completion] = await getCompletionPercentage({ startDate: date });
      const percentage = completion?.percentage || 0; // Use optional chaining to handle undefined

      // Set the dot color based on the percentage
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

  return (
    <Calendar
      markedDates={{
        ...markedDates,
        [today]: { selected: true }, // Highlight today
      }}
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
  );
}