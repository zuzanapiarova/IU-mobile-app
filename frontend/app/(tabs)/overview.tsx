import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList } from 'react-native';
import { Text, Card, TextInput, Button, List, useTheme, Surface } from 'react-native-paper';
import { initializeDatabase } from '../../database/db';
import { addHabit, getAllHabits } from '../../database/habitsQueries';

import { Habit } from '../../constants/interfaces'
import { globalStyles } from '../../constants/globalStyles';

export default function HabitsScreen()
{
  const theme = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');

  useEffect(() => {
    async function load() {
      await initializeDatabase();
      const data = await getAllHabits();
      setHabits(data);
    }
    load();
  }, []);

  async function handleAddHabit() {
    if (!newHabit.trim()) return;
    await addHabit(newHabit);
    setNewHabit('');
    const updated = await getAllHabits();
    setHabits(updated);
  }

  const renderHabit = ({ item }: { item: Habit }) => (
    <Card style={globalStyles.container} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
          {item.name}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <Surface 
            style={ globalStyles.display }
            elevation={0}
    >
      <Card style={globalStyles.card} mode="outlined">
        <Card.Content>
          <TextInput
            label="New Habit"
            value={newHabit}
            mode="outlined"
            onChangeText={setNewHabit}
            style={globalStyles.input}
          />
          <Button 
            mode="contained-tonal" 
            onPress={handleAddHabit}
            disabled={!newHabit.trim()}
            style={globalStyles.button}
          >
            Add Habit
          </Button>
        </Card.Content>
      </Card>

      <List.Section>
        <List.Subheader>My Habits</List.Subheader>
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHabit}
          ListEmptyComponent={<Text style={globalStyles.empty}>No habits yet</Text>}
        />
      </List.Section>
    </Surface>
  );
}