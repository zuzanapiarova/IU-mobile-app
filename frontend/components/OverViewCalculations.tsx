import { getHabitsForDay } from "@/database/habitsQueries";
import { Habit } from "@/constants/interfaces";

// Function to fetch habits for a specific day and calculate the completion percentage
export async function getCompletionPercentageForDay(date: string): Promise<number> {
  try {
    // Fetch all habits for the given day
    const habits: Habit[] = await getHabitsForDay(date);

    // If there are no habits, return 0% completion
    if (habits.length === 0) {
      return 0;
    }

    // Count the number of completed habits (status = 1)
    const completedCount = habits.filter((habit) => habit.status === 1).length;

    // Calculate the completion percentage
    const percentage = (completedCount / habits.length) * 100;

    return percentage;

  } catch (error) {
    console.error(`Error calculating completion percentage for ${date}:`, error);
    return 0; // Return 0% in case of an error
  }
}