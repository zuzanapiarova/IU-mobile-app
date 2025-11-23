import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HabitsScreen from '../../app/(tabs)/habits';
import { useUser } from '../../constants/UserContext';
import { getAllHabits, addHabit, updateHabit, deleteHabit } from '../../api/habitsApi';
import { Provider as PaperProvider } from 'react-native-paper';

jest.mock('../../constants/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('../../api/habitsApi', () => ({
  getAllHabits: jest.fn(),
  addHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
}));

describe('HabitsScreen', () => {
  const mockUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getAllHabits as jest.Mock).mockResolvedValue([]);
  });

  it('renders the initial state with no habits', async () => {
    const { getByText } = render(
      <PaperProvider>
        <HabitsScreen />
      </PaperProvider>
    );

    await waitFor(() => {
      expect(getByText('My Habits')).toBeTruthy();
      expect(getByText('No habits yet')).toBeTruthy();
    });
  });

  it('adds a new habit', async () => {
    const { getByTestId, getByText } = render(
      <PaperProvider>
        <HabitsScreen />
      </PaperProvider>
    );
  
    const newHabitInput = getByTestId('new-habit-input');
    const addButton = getByText('Add Habit');
  
    // Simulate entering text into the input field
    await act(async () => {
      fireEvent.changeText(newHabitInput, 'Exercise');
    });
  
    // Simulate pressing the "Add Habit" button
    await act(async () => {
      fireEvent.press(addButton);
    });
  
    // Verify that the addHabit function was called with the correct arguments
    await waitFor(() => {
      expect(addHabit).toHaveBeenCalledWith('Exercise', 'daily', mockUser.id);
      expect(getAllHabits).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('deletes a habit', async () => {
    (getAllHabits as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Exercise', frequency: 'daily' },
    ]);

    const { getByTestId, getByText } = render(
      <PaperProvider>
        <HabitsScreen />
      </PaperProvider>
    );

    await waitFor(() => {
      expect(getByText('Exercise')).toBeTruthy();
    });

    const deleteButton = getByTestId('delete-habit-1');

    await act(async () => {
      fireEvent.press(deleteButton);
    });

    const confirmDeleteButton = getByText('Delete');

    await act(async () => {
      fireEvent.press(confirmDeleteButton);
    });

    await waitFor(() => {
      expect(deleteHabit).toHaveBeenCalledWith(1);
      expect(getAllHabits).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('updates a habit', async () => {
    (getAllHabits as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Exercise', frequency: 'daily' },
    ]);
  
    const { getByTestId, getByText } = render(
      <PaperProvider>
        <HabitsScreen />
      </PaperProvider>
    );
  
    // Wait for the habit to be rendered
    await waitFor(() => {
      expect(getByText('Exercise')).toBeTruthy();
    });
  
    // Find and press the pencil icon (edit button)
    const editButton = getByTestId('edit-habit-1'); // Add a `testID` to the pencil icon in your component
    await act(async () => {
      fireEvent.press(editButton);
    });
  
    // Simulate entering a new habit name
    const editHabitInput = getByTestId('edit-habit-input');
    await act(async () => {
      fireEvent.changeText(editHabitInput, 'Morning Exercise');
    });
  
    // Press the "Update" button
    const updateButton = getByText('Update');
    await act(async () => {
      fireEvent.press(updateButton);
    });
  
    // Verify that the updateHabit function was called with the correct arguments
    await waitFor(() => {
      expect(updateHabit).toHaveBeenCalledWith(1, 'Morning Exercise', 'daily');
      expect(getAllHabits).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('does not add a habit with an empty name', async () => {
    const { getByText } = render(
      <PaperProvider>
        <HabitsScreen />
      </PaperProvider>
    );

    const addButton = getByText('Add Habit');

    await act(async () => {
      fireEvent.press(addButton);
    });

    await waitFor(() => {
      expect(addHabit).not.toHaveBeenCalled();
    });
  });
});