import { getHabitsForDay } from "@/api/habitsApi";
import { Habit } from "@/constants/interfaces";

// Function to fetch habits for a specific day and calculate the completion percentage
export async function getCompletionPercentageForDay(userId: number, date: string): Promise<number>
{

  try {
    // Fetch all habits for the given day
    const habits: Habit[] = await getHabitsForDay(userId, date);

    // if there are no habits, 0% completion (avoid zero division)
    if (habits.length === 0) return 0;
    // Map the habits to ensure status is an integer (0 or 1)
    const transformedHabits = habits.map((habit) => ({
      ...habit,
      status: habit.status ? 1 : 0, // Convert boolean to integer
    }));
    const completedPercentage =
      habits.length > 0
        ? Math.round((transformedHabits.filter((habit) => habit.status === 1).length / habits.length) * 100)
        : 0;
    return completedPercentage;

  } catch (error) {
    console.error(`Error calculating completion percentage for ${date}:`, error);
    return 0; // Return 0% in case of an error
  }
}