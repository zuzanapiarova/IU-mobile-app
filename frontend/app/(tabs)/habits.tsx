import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { Text, Card, TextInput, Button, List, useTheme, Surface, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// import { addHabit, getAllHabits, updateHabit, deleteHabit } from '../../database/habitsQueries';
import { getAllHabits, addHabit, updateHabit, deleteHabit /*, updateHabitName, updateHabitFrequency*/ } from '@/api/habitsApi';
import { Habit } from '../../constants/interfaces'
import { globalStyles } from '../../constants/globalStyles';

// gets data from the habits table
export default function HabitsScreen()
{
  const theme = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [updatedHabitName, setUpdatedHabitName] = useState('');
  const [updatedHabitFrequency, setUpdatedHabitFrequency] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getAllHabits();
      console.log('Loaded habits:', data);
      setHabits(data);
    }
    load();
  }, []);

  // add new habit to database
  async function handleAddHabit() {
    if (!newHabit.trim()) return;
    await addHabit(newHabit.trim());
    setNewHabit('');
    const updated = await getAllHabits();
    setHabits(updated);
  }

  // delete habit from db 
  async function handleDeleteHabit() {
    if (selectedHabit) {
      await deleteHabit(selectedHabit.habit_id);
      const updated = await getAllHabits();
      setHabits(updated);
      setDeleteModalVisible(false);
      setSelectedHabit(null);
    }
  }

  // todo: change frequency if it was changed, if not, keep selectedHabit.frequency
  async function handleUpdateHabit() {
    if (selectedHabit) {
      if (updatedHabitName.trim() || updatedHabitFrequency) {
        await updateHabit(selectedHabit.habit_id, updatedHabitName.trim(), updatedHabitFrequency);
        const updated = await getAllHabits();
        setHabits(updated);
        setEditModalVisible(false);
        setSelectedHabit(null);
      }
    }
  }

  // render habit to screen 
  const renderHabit = ({ item }: { item: Habit }) => (
    <Card style={[globalStyles.listItem, {backgroundColor: theme.colors.background }]} mode="elevated">
      <Card.Content style={ globalStyles.inRow }>
        <Text variant="titleMedium" style={{ color: theme.colors.primary, flexWrap: 'wrap', flex: 1 }}>
          {item.name}
        </Text>
        <Surface elevation={0} style={ globalStyles.inRow }>
          <MaterialCommunityIcons
            name="pencil"
            size={24}
            color={theme.colors.primary}
            paddingRight='12'
            onPress={() => {
              setSelectedHabit(item);
              setUpdatedHabitName(item.name);
              setUpdatedHabitFrequency(item.frequency);
              setEditModalVisible(true);
            }}
          />
          <MaterialCommunityIcons
            name="trash-can"
            size={24}
            color={theme.colors.error}
            onPress={() => {
              setSelectedHabit(item);
              setDeleteModalVisible(true);
            }}
          />
        </Surface>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <Surface style={ [globalStyles.display, { flex: 1}] } elevation={0}>
          <Text variant='displaySmall'>My Habits</Text>
          <Card style={ [globalStyles.card, {backgroundColor: theme.colors.background }]} mode="elevated">
            <Card.Content>
              <TextInput
                label="New Habit"
                value={newHabit}
                mode="outlined"
                onChangeText={setNewHabit}
                style={globalStyles.input}
              />
              <Button 
                mode='contained-tonal'
                theme={theme}
                onPress={handleAddHabit}
                disabled={!newHabit.trim()}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.surface}
                style={ globalStyles.button }
              >
                Add Habit
              </Button>
            </Card.Content>
          </Card>

          <List.Section style={{ flex: 1 }}>
            <FlatList
              data={habits}
              keyExtractor={(item) => item.habit_id.toString()}
              renderItem={renderHabit}
              ListEmptyComponent={<Text style={globalStyles.empty}>No habits yet</Text>}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            />
          </List.Section>
        </Surface>

      {/* Delete Modal */}
      <Portal>
        <Modal visible={isDeleteModalVisible} onDismiss={() => setDeleteModalVisible(false)}>
          <Card style={[globalStyles.modal, { backgroundColor: theme.colors.background}]} >
            <Card.Content>
              <Text>Are you sure you want to delete this habit?</Text>
              <Surface style={ globalStyles.inRow } elevation={0}>
                <Button onPress={() => setDeleteModalVisible(false)}>Cancel</Button>
                <Button onPress={handleDeleteHabit} textColor={theme.colors.error}>
                  Delete
                </Button>
              </Surface>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Edit Habit Modal */}
      <Portal >
        <Modal visible={isEditModalVisible} onDismiss={() => setEditModalVisible(false)}>
          <Card style={[globalStyles.modal, { backgroundColor: theme.colors.background}]}>
            <Card.Content>
              <TextInput
                label="Edit Habit"
                value={updatedHabitName}
                mode="outlined"
                onChangeText={setUpdatedHabitName}
                style={globalStyles.input}
              />
              <Surface style={globalStyles.inRow} elevation={0}>
                <Button onPress={() => setEditModalVisible(false)}>Cancel</Button>
                <Button onPress={handleUpdateHabit}>Update</Button>
              </Surface>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}