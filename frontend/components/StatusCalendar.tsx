import React, { useEffect, useState, useCallback } from "react";
import { Calendar } from "react-native-calendars";
import { useTheme, Button, Modal, Portal } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { getCompletionPercentageForDay } from "./OverViewCalculations";
import { globalStyles } from "../constants/globalStyles";
import { useUser } from "@/constants/UserContext";
import HabitsList from "./HabitsCheckList";
import { useConnection } from '@/constants/ConnectionContext';

// renders current calendar month with dots for past days representing progress
// scrollable through months to see day completions
// clicking on a date opens it up for retrospective habit completion
export default function StatusCalendar()
{
  const theme = useTheme();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth() + 1; // make month 1-based
  const currentYear = new Date().getFullYear();
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isModalVisible, setModalVisible] = useState(false);
  const { user } = useUser();
  const { setBannerMessage } = useConnection();

  const createdAtDate = user ? new Date(user.createdAt) : new Date();
  const createdAtYear = createdAtDate.getFullYear();
  const createdAtMonth = createdAtDate.getMonth() + 1;
  const createdAtDay = createdAtDate.getDate();

  // generate dot color for days in selected month and year
  const generateMarkedDates = useCallback(
    async (year: number, month: number) => {
      if (!user) return;
      setMarkedDates({}); // reset before generating so UI stays consistent

      // dont generate dots for dates when user was not using the app or in the future
      if (year < createdAtYear || year > new Date().getFullYear()) return;
      if (
        (year <= createdAtYear && month < createdAtMonth) ||
        (year === new Date().getFullYear() && month > new Date().getMonth() + 1)
      )
        return;

      let daysInMonth = new Date(year, month, 0).getDate();
      if (month === new Date(today).getMonth() + 1)
        daysInMonth = new Date(today).getDate();
      const newMarkedDates: { [key: string]: any } = {};

      for (let day = 1; day <= daysInMonth; day++) {
        if (
          month === createdAtMonth &&
          year === createdAtYear &&
          day < createdAtDay
        )
          continue;
        const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        try {
          const percentage = await getCompletionPercentageForDay(user.id, date);

          // determine dot color based on the updated success and failure limits
          let dotColor = globalStyles.yellow.color;
          if (percentage >= user.successLimit)
            dotColor = globalStyles.green.color;
          else if (percentage <= user.failureLimit) dotColor = "red";
          newMarkedDates[date] = { marked: true, dotColor };
        } catch (error) {
          if (error instanceof Error) setBannerMessage(error.message);
          else setBannerMessage("An unexpected error occurred. Please try again.");
        }
      };
      // Update the state with the new marked dates
      setMarkedDates(newMarkedDates);
    },
    [user, createdAtYear, createdAtMonth, createdAtDay, today],
  );

  // reset to the current month and year when the screen is in focus
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setSelectedMonth(now.getMonth() + 1);
      setSelectedYear(now.getFullYear());
      generateMarkedDates(now.getFullYear(), now.getMonth() + 1);
    }, [generateMarkedDates]),
  );

  // // generate marked dates on the initial render
  // useEffect(() => {
  //   generateMarkedDates(currentYear, currentMonth); // Generate marked dates for the current month
  // }, [currentYear, currentMonth, generateMarkedDates]);

  // // regenerate dots when successLimit or failureLimit changes
  // useEffect(() => {
  //   generateMarkedDates(selectedYear, selectedMonth);
  // }, [generateMarkedDates, selectedMonth, selectedYear]);

  // handle date selection to show list of habits for that day
  const handleDateSelect = async (date: string) => {
    if (date === today) return;
    setSelectedDate(date);
    setModalVisible(true);
  };

  // update the dot color for the selected date
  const updateSelectedDateDotColor = async (date: string) => {
    if (!user) return;
    try {
      const percentage = await getCompletionPercentageForDay(user.id, date);

      let dotColor = globalStyles.yellow.color;
      if (percentage >= user.successLimit) dotColor = "green";
      else if (percentage <= user.failureLimit) dotColor = "red";

      // update the markedDates state for the selected date
      setMarkedDates((prevMarkedDates) => {
        const updatedMarkedDates = {
          ...prevMarkedDates,
          [date]: { ...prevMarkedDates[date], dotColor },
        };
        return updatedMarkedDates;
      });
    } catch (error) {
      if (error instanceof Error) setBannerMessage(error.message);
      else setBannerMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <Calendar
        key={`${selectedYear}-${selectedMonth}-${user?.themePreference}`} // force re-render when month changes
        current={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`} // dynamically set the displayed month and year
        markedDates={{
          ...markedDates,
          [today]: { selected: true },
        }}
        onDayPress={(day) => handleDateSelect(day.dateString)}
        onMonthChange={(month) => {
          setSelectedMonth(month.month);
          setSelectedYear(month.year);
          generateMarkedDates(month.year, month.month);
        }}
        style={{ borderRadius: 8 }}
        theme={{
          monthTextColor: theme.colors.primary,
          backgroundColor: 'red',
          calendarBackground: theme.colors.background,
          selectedDayBackgroundColor: theme.colors.primary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          arrowColor: theme.colors.secondary,
        }}
        firstDay={1} // start the week on Monday
      />
      {selectedDate && (
        <Portal>
          <Modal
            visible={isModalVisible}
            onDismiss={() => setModalVisible(false)}
            style={{ maxHeight: "80%", paddingTop: 30, paddingBottom: 30 }}
            contentContainerStyle={[
              globalStyles.modal,
              {
                paddingTop: 30,
                paddingBottom: 30,
                display: "flex",
                flexDirection: "column",
              },
            ]}
          >
            <HabitsList
              date={selectedDate!}
              onHabitsUpdated={() => {
                if (selectedDate) updateSelectedDateDotColor(selectedDate);
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