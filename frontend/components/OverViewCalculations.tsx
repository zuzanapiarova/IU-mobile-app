import { CompletionQueryOptions,  } from '../constants/interfaces'
import { db } from '../database/db'
import { CountRow } from '../constants/interfaces'

export async function getCompletionPercentage({
  startDate,
  endDate,
  habitIds,
}: CompletionQueryOptions): Promise<{ date: string; percentage: number }[]> {
  
  const finalEndDate = endDate || startDate;

  // create date list between start and end
  const dateList: string[] = [];
  let current = new Date(startDate);
  const last = new Date(finalEndDate);

  while (current <= last) {
    dateList.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  const results: { date: string; percentage: number }[] = [];

  // count of all habits for that day
  for (const day of dateList) {
    let totalHabitsQuery = 'SELECT COUNT(*) as count FROM habits';
    const totalParams: any[] = [];

    if (habitIds && habitIds.length > 0) {
      const placeholders = habitIds.map(() => '?').join(',');
      totalHabitsQuery += ` WHERE id IN (${placeholders})`;
      totalParams.push(...habitIds);
    }

    const totalHabitsRow = (await db.getFirstAsync(totalHabitsQuery, totalParams)) as CountRow | undefined;
    const totalHabits = totalHabitsRow?.count ?? 0;

    if (totalHabits === 0) {
      results.push({ date: day, percentage: 0 });
      continue;
    }

    // completed habits for that day
    let completedQuery = `
      SELECT COUNT(*) as count
      FROM habit_completions
      WHERE date = ? AND status = 1
    `;
    const completedParams: any[] = [day];

    if (habitIds && habitIds.length > 0) {
      const placeholders = habitIds.map(() => '?').join(',');
      completedQuery += ` AND habit_id IN (${placeholders})`;
      completedParams.push(...habitIds);
    }

    const completedRow = (await db.getFirstAsync(completedQuery, completedParams)) as CountRow | undefined;
    const completedCount = completedRow?.count ?? 0;

    // % of completed for that date
    results.push({
      date: day,
      percentage: (completedCount / totalHabits) * 100,
    });
  }

  return results;
}