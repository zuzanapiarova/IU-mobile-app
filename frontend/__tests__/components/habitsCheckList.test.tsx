import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HabitsList from '../../components/HabitsCheckList';
import { completeHabit, uncompleteHabit, getHabitsForDay } from '../../api/habitsApi';
import { useUser } from '@/constants/UserContext';
import { useConnection } from '@/constants/ConnectionContext';
import { useNavigation } from '@react-navigation/native';

// ---------- Mocks ----------
jest.mock('../../api/habitsApi');
jest.mock('@/constants/UserContext');
jest.mock('@/constants/ConnectionContext');

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ testID }: any) => <>{testID}</>,
}));

const mockNavigate = jest.fn();
(useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });

const mockSetBannerMessage = jest.fn();
(useConnection as jest.Mock).mockReturnValue({
  setBannerMessage: mockSetBannerMessage,
});

// mock data
const mockUser = {
  id: 1,
  successLimit: 80,
  failureLimit: 30,
  createdAt: '2024-01-01',
};

const mockHabits = [
  {
    id: 1,
    habit_id: 101,
    name: 'Drink Water',
    status: 0,
  },
  {
    id: 2,
    habit_id: 102,
    name: 'Read Book',
    status: 1,
  },
];

describe('HabitsList – rendering', () => {
  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);
  });

  it('renders today header and habits', async () => {
    const today = new Date().toISOString().split('T')[0];

    const { getByText } = render(<HabitsList date={today} />);

    await waitFor(() => {
      expect(getByText("Today's Tasks")).toBeTruthy();
      expect(getByText('Drink Water')).toBeTruthy();
      expect(getByText('Read Book')).toBeTruthy();
    });
  });

  it('completes an unfinished habit when toggled', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);
    (completeHabit as jest.Mock).mockResolvedValue(undefined);
  
    const today = new Date().toISOString().split('T')[0];
    const onUpdated = jest.fn();
  
    const { getByTestId } = render(
      <HabitsList date={today} onHabitsUpdated={onUpdated} />
    );
  
    const toggle = await waitFor(() =>
      getByTestId('toggle-habit-101')
    );
    
    fireEvent.press(toggle);
  
    await waitFor(() => {
      expect(completeHabit).toHaveBeenCalledWith(101, today);
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('completes an unfinished habit when toggled', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);
    (completeHabit as jest.Mock).mockResolvedValue(undefined);
  
    const today = new Date().toISOString().split('T')[0];
    const onUpdated = jest.fn();
  
    const { getByTestId } = render(
      <HabitsList date={today} onHabitsUpdated={onUpdated} />
    );
  
    await waitFor(() => {
      fireEvent.press(getByTestId('toggle-habit-101'));
    });
  
    await waitFor(() => {
      expect(completeHabit).toHaveBeenCalledWith(101, today);
      expect(onUpdated).toHaveBeenCalled();
    });
  });

  it('uncompletes a completed habit when toggled', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue(mockHabits);
    (uncompleteHabit as jest.Mock).mockResolvedValue(undefined);
  
    const today = new Date().toISOString().split('T')[0];
  
    const { getByTestId } = render(<HabitsList date={today} />);
  
    await waitFor(() => {
      fireEvent.press(getByTestId('toggle-habit-102'));
    });
  
    expect(uncompleteHabit).toHaveBeenCalledWith(102, today);
  });

  it('shows Add Habit button when no habits exist for today', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);
  
    const today = new Date().toISOString().split('T')[0];
    const { getByText } = render(<HabitsList date={today} />);
  
    await waitFor(() => {
      expect(getByText('Add Habit')).toBeTruthy();
    });
  
    fireEvent.press(getByText('Add Habit'));
    expect(mockNavigate).toHaveBeenCalledWith('habits');
  });

  it('shows no records message for past date', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);
  
    const { getByText } = render(<HabitsList date="2024-02-01" />);
  
    await waitFor(() => {
      expect(getByText('No records for this day.')).toBeTruthy();
    });
  });

  it('shows inactive account message for date before user creation', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);
  
    const { getByText } = render(<HabitsList date="2023-01-01" />);
  
    await waitFor(() => {
      expect(
        getByText('Your account was not active on this day yet.')
      ).toBeTruthy();
    });
  });

  it('shows banner message on API error', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (getHabitsForDay as jest.Mock).mockRejectedValue(new Error('Network error'));
  
    const today = new Date().toISOString().split('T')[0];
    render(<HabitsList date={today} />);
  
    await waitFor(() => {
      expect(mockSetBannerMessage).toHaveBeenCalledWith('Network error');
    });
  });

});
