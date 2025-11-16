import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HabitsList from '../components/HabitsCheckList';
import { useUser } from '@/constants/UserContext';
import { getHabitsForDay, completeHabit, uncompleteHabit } from '@/api/habitsApi';

// mock dependencies
jest.mock('@/constants/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/api/habitsApi', () => ({
  getHabitsForDay: jest.fn(),
  completeHabit: jest.fn(),
  uncompleteHabit: jest.fn(),
}));

describe('HabitsCheckList', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    successLimit: 80,
    failureLimit: 20,
    createdAt: '2023-01-01'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
  });

  // test 1: loading indicator
  it('renders a loading indicator while loading', () => {
    const { getByTestId } = render(<HabitsList date="2023-11-16" />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // test 2: user not logged in
  it('displays a message if the user is not logged in', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    const { getByText } = render(<HabitsList date="2023-11-16" />);
    expect(getByText('Please log in to view your habits.')).toBeTruthy();
  });

  // test 3: render list when there are no habits in the list and test add first habit button
  it('displays "Add Habit" button when there are no habits', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);
    const { getByText } = render(<HabitsList date="2023-11-16" />);
    await waitFor(() => {
      expect(getByText('Add Habit')).toBeTruthy();
    });
  });

  //test 4: render habit list 
  it('renders the list of habits when habits are available', async () => {
    const mockHabits = [
      { habit_id: 1, name: 'Habit 1', status: 0 },
      { habit_id: 2, name: 'Habit 2', status: 1 },
    ];
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);

    const { getByText } = render(<HabitsList date="2023-11-16" />);
    await waitFor(() => {
      expect(getByText('Habit 1')).toBeTruthy();
      expect(getByText('Habit 2')).toBeTruthy();
    });
  });

  // test 5: completing and uncompleting habits 
  it('handles toggle check functionality', async () => {
    const mockHabits = [
      { habit_id: 1, name: 'Habit 1', status: 0 },
    ];
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);
    (completeHabit as jest.Mock).mockResolvedValue({});
    (uncompleteHabit as jest.Mock).mockResolvedValue({});

    const { getByText, getByTestId } = render(<HabitsList date="2023-11-16" />);
    await waitFor(() => {
      expect(getByText('Habit 1')).toBeTruthy();
    });

    const toggleButton = getByTestId('toggle-check-1');
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(completeHabit).toHaveBeenCalledWith(1, '2023-11-16');
    });
  });
});