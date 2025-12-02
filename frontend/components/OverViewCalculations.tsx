import { getHabitsForDay } from "@/api/habitsApi";
import { Habit } from "@/constants/interfaces";

// function to fetch habits for a specific day and calculate the completion percentage
export async function getCompletionPercentageForDay(userId: number, date: string): Promise<number>
{
  try {
    const habits: Habit[] = await getHabitsForDay(userId, false, date);
    if (habits.length === 0) return 0;

    // map habit status to integer from boolean stored in the db
    const transformedHabits = habits.map((habit) => ({
      ...habit,
      status: habit.status ? 1 : 0
    }));

    // calculate percentage based on number of all habits for that date and their completion status
    const completedPercentage =
      habits.length > 0
        ? Math.round(
            (transformedHabits.filter((habit) => habit.status === 1).length /
              habits.length) *
              100,
          )
        : 0;
    return completedPercentage;
  } catch (error) {
    throw error;
  }
}
