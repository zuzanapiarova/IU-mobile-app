import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { List, Text, useTheme, Surface, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "../constants/navigation";
import { HabitWithCompletion } from "../constants/interfaces";
import { globalStyles } from "../constants/globalStyles";
import { completeHabit, uncompleteHabit, getHabitsForDay } from "../api/habitsApi";
import { useUser } from "@/constants/UserContext";
import Loading from "./Loading";
import { useConnection } from '@/constants/ConnectionContext';

// get data from the habit_completions table to render list of habits for speciided date
export default function HabitsList({ date, onHabitsUpdated }: {date: string, onHabitsUpdated?: () => void})
{
  const today = new Date().toISOString().split("T")[0];
  const theme = useTheme();
  const { user } = useUser();
  const { setBannerMessage } = useConnection();
  const navigation = useNavigation<NativeStackNavigationProp<RootTabParamList>>();
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  // const [loading, setLoading] = useState(true);

  // fetch habits for the day
  const loadHabits = useCallback(async () => {
    try {
      if (!user) throw new Error('You must be logged in!');
      const data = await getHabitsForDay(user.id, false, date);
      const transformedData = (data || []).map((habit: HabitWithCompletion) => ({
        ...habit,
        status: habit.status ? 1 : 0,
      }));
      setHabits(transformedData);
    } catch (error) {
      if (error instanceof Error) setBannerMessage(error.message);
      else setBannerMessage("An unexpected error occurred. Please try again.");
    }
  }, [user, date]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
      return () => {};
    }, [loadHabits])
  );

  // fallback
  useEffect(() => {
    loadHabits();
  }, []);

  // toggle habit completion or uncompletion for habit identified by id
  const toggleCheck = async (id: number) => {
    try {
      const habitToUpdate = habits.find((habit) => habit.habit_id === id);
      if (habitToUpdate) {
        const newStatus = habitToUpdate.status === 1 ? 0 : 1;
        if (newStatus === 1)
          await completeHabit(id, date);
        else
          await uncompleteHabit(id, date);
      }
      await loadHabits();
      if (onHabitsUpdated) onHabitsUpdated();
    } catch (error) {
      if (error instanceof Error) setBannerMessage(error.message);
      else setBannerMessage("An unexpected error occurred. Please try again.");
    }
  };

  const completedPercentage =
    habits.length > 0 ? Math.round((habits.filter((habit) => habit.status === 1).length / habits.length) *100,)
                      : 0;

  // sort habits so unfinished are always on top
  const sortedHabits = [
    ...habits.filter((h) => h.status === 0),
    ...habits.filter((h) => h.status === 1),
  ];

  if (!user) return null;

  // render one item(row) in the habit list 
  const renderItem = ({ item }: { item: HabitWithCompletion }) => {
    const isChecked = item.status === 1;
    return (
      <List.Item
        title={() => (
          <Text style={[globalStyles.habitText, isChecked && globalStyles.checkedText, {
                        color: isChecked
                          ? theme.colors.onSurfaceDisabled
                          : theme.colors.onSurface,
          }]}>
            {item.name}
          </Text>
        )}
        left={() => (
          <TouchableOpacity onPress={() => toggleCheck(item.habit_id)}>
            <MaterialCommunityIcons 
              size={24} 
              color={isChecked ? theme.colors.primary : theme.colors.outline}
              name={isChecked ? "check-circle-outline" : "circle-outline"}
              testID={`toggle-habit-${item.habit_id}`}
            />
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <Surface elevation={0} style={[globalStyles.container, {backgroundColor: theme.colors.background, flex: (date === today) ? 1 : 0 }]}>
      <Surface elevation={0} style={[globalStyles.inRow, { paddingBottom: 6 }]}>

        {/* Header with date  */}
        {date === today ?
        (<Text variant="titleMedium">Today&apos;s Tasks</Text>)
        :
        (<Text variant="titleMedium" style={{marginTop: 12}}>Tasks for {date}</Text>)
        }

        {/* Completion percentage */}
        {habits.length > 0 && (
        <Text variant="titleLarge" style={{color: completedPercentage >= user?.successLimit ? "green" : completedPercentage <= user.failureLimit ? "red" : globalStyles.yellow.color}}>
          {completedPercentage}%
        </Text>)}
      </Surface>

      {/* Add habit button if there are no habits - renders only for today, not retrospectively */}
      {habits.length === 0 && date === today && (
      <Surface style={globalStyles.center} elevation={0}>
        <Button mode="contained" onPress={() => navigation.navigate("habits")}>
          Add Habit
        </Button>
      </Surface>
      )}

      {/* No records message */}
      {habits.length === 0 && date !== today && new Date(date).toISOString().split("T")[0] > new Date(user.createdAt).toISOString().split("T")[0] && (
        <Text style={{ padding: 10 }}>No records for this day.</Text>
      )}

      {/* User was not active yet on this day message */}
      {new Date(date).toISOString().split("T")[0] < new Date(user.createdAt).toISOString().split("T")[0] && (
        <Text style={{ padding: 10, color: theme.colors.onSurfaceDisabled }}>
          Your account was not active on this day yet.
        </Text>
      )}

      {/* Habit list */}
      {habits.length > 0 && (
        <FlatList
          data={sortedHabits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (
          <View style={globalStyles.separator} />
          )}
        />
      )}
    </Surface>
  )
}