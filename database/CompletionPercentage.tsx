import { CompletionQueryOptions,  } from '../constants/interfaces'
import { db } from '../database/db'
import { useState, useEffect } from 'react';
import { globalStyles } from '@/constants/globalStyles';
import { CountRow } from '../constants/interfaces'
import { List, Checkbox, Text, useTheme, Surface, Button, Portal, Modal, Card } from 'react-native-paper';

async function abc({
    date,
    habitIds,
  }: {
    date: string;
    habitIds?: number[];
  }): Promise<{ date: string; percentage: number }> {
    // Count all habits for the given day
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
      return { date, percentage: 0 }; // No habits for the day
    }
  
    // Count completed habits for the given day
    let completedQuery = `
      SELECT COUNT(*) as count
      FROM habit_completions
      WHERE date = ? AND status = 1
    `;
    const completedParams: any[] = [date];
  
    if (habitIds && habitIds.length > 0) {
      const placeholders = habitIds.map(() => '?').join(',');
      completedQuery += ` AND habit_id IN (${placeholders})`;
      completedParams.push(...habitIds);
    }
  
    const completedRow = (await db.getFirstAsync(completedQuery, completedParams)) as CountRow | undefined;
    const completedCount = completedRow?.count ?? 0;
  
    // Calculate the percentage of completed habits
    const percentage = (completedCount / totalHabits) * 100;
  
    return { date, percentage };
  }

export default function CompletionPercentage({ date }: { date: string }) {
    const [percentage, setPercentage] = useState<number | null>(null);
  
    useEffect(() => {
      // Fetch the completion percentage for the given date
      abc({ date })
        .then((result) => {
          setPercentage(result.percentage);
        })
        .catch((error) => {
          console.error('Error fetching completion percentage:', error);
        });
    }, [date]);
  
    if (percentage === null) {
      return <Text>Loading...</Text>;
    }
  
    return (
      <Text
        variant="titleLarge"
        style={{
          color: percentage === 100 ? 'green' : percentage > 0 ? globalStyles.yellow.color : 'red',
        }}
      >
        {percentage}%
      </Text>
    );
  }