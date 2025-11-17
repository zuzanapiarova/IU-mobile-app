import { initializeHabitCompletionsForDay, getMostRecentDate } from "../api/habitsApi";

// add records to habit_completions - add each habit with status false(=not completed) for each day since the last record
export async function initializeHabitCompletions()
{
  const today = new Date().toISOString().split("T")[0];
  try {
    const mostRecentDate = (await getMostRecentDate()) ?? null;

    let currentDate = mostRecentDate
      ? new Date(mostRecentDate)
      : new Date(today);

    while (currentDate <= new Date(today)) {
      const dateString = currentDate.toISOString().split("T")[0];
      await initializeHabitCompletionsForDay(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } catch (error) {
    console.error("Error initializing missing habit completions:", error);
    throw error;
  }
}
