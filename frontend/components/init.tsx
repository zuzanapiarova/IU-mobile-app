import { initializeHabitCompletionsForDay, getMostRecentDate } from '../api/habitsApi';

const today = new Date().toISOString().split('T')[0];

// add records to habit_completions 
export async function initializeHabitCompletions()
{
  try {
    const mostRecentDate = await getMostRecentDate() ?? null;
    let currentDate = mostRecentDate ? new Date(mostRecentDate) : new Date(today);
    while (currentDate <= new Date(today)) {
      const dateString = currentDate.toISOString().split('T')[0];
      console.log(`Initializing habit completions for: ${dateString}`);
      await initializeHabitCompletionsForDay(dateString);
      currentDate.setDate(currentDate.getDate() + 1); // increment date for next loop run
    }
  } catch (error) {
    console.error('❌ Error initializing missing habit completions:', error);
    throw error;
  }
}