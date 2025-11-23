import React, { useEffect, useState } from 'react';
import { FlatList,  KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, TextInput, Button, List, useTheme, Surface, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@/constants/UserContext';
import { getAllHabits, addHabit, updateHabit, deleteHabit } from '../../api/habitsApi';
import { Habit } from '../../constants/interfaces'
import { globalStyles } from '../../constants/globalStyles';

// habit management component - render current habits, add habits
export default function HabitsScreen()
{
  const theme = useTheme();
  const { user } = useUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [updatedHabitName, setUpdatedHabitName] = useState('');
  const [updatedHabitFrequency, setUpdatedHabitFrequency] = useState('');

  useEffect(() => {
    async function load() {
      if (!user) return alert('You must be logged in!');
      const data = await getAllHabits(user.id);
      setHabits(data);
    }
    load();
  }, [user]);

  // add new habit to database
  const handleAddHabit = async () => {
    if (!newHabit.trim()) return;
    if (!user) return alert('You must be logged in!');
  
    try {
      await addHabit(newHabit.trim(), 'daily', user.id);
      setNewHabit('');
      const updated = await getAllHabits(user.id);
      setHabits(updated);
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  // delete habit from db 
  async function handleDeleteHabit() {
    if (selectedHabit) {
      if (!user) return alert('You must be logged in!');
      try {
        await deleteHabit(selectedHabit.id);
        const updated = await getAllHabits(user.id);
        setHabits(updated);
        setDeleteModalVisible(false);
        setSelectedHabit(null);
      } catch (error) {
        console.error('Error deleting habit:', error);
        alert('Failed to delete the habit. Please try again.');
      }
    }
  }

  // update habid identified by its id
  async function handleUpdateHabit() {
    if (selectedHabit) {
      if (!user) return alert('You must be logged in!');
      if (updatedHabitName.trim() || updatedHabitFrequency) {
        await updateHabit(selectedHabit.id, updatedHabitName.trim(), updatedHabitFrequency);
        const updated = await getAllHabits(user.id);
        setHabits(updated);
        setEditModalVisible(false);
        setSelectedHabit(null);
      }
    }
  }

  // render habit in one row
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
            testID={`edit-habit-${item.id}`}
          />
          <MaterialCommunityIcons
            name="trash-can"
            size={24}
            color={globalStyles.red.color}
            onPress={() => {
              setSelectedHabit(item);
              setDeleteModalVisible(true);
            }}
            testID={`delete-habit-${item.id}`}
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
        <Surface style={ [globalStyles.display, {backgroundColor: theme.colors.surface, flex: 1}] } elevation={0}>
          <Text variant='displaySmall'>My Habits</Text>
          <Card style={ [globalStyles.card, {backgroundColor: theme.colors.background }]} mode="elevated">
            <Card.Content>
              <TextInput
                label="New Habit"
                value={newHabit}
                mode="outlined"
                onChangeText={setNewHabit}
                style={[globalStyles.input,{backgroundColor: theme.colors.surface}]}
                testID="new-habit-input"
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
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHabit}
              ListEmptyComponent={<Text style={globalStyles.empty}>No habits yet</Text>}
              contentContainerStyle={{ flexGrow: 1}}
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
                <Button onPress={handleDeleteHabit} textColor={globalStyles.red.color}>
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
                testID="edit-habit-input"
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