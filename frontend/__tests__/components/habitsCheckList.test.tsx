jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HabitsCheckList from '../../components/HabitsCheckList';
import { useUser } from '../../constants/UserContext';
import { completeHabit, getHabitsForDay } from '../../api/habitsApi';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { useConnection } from '../../constants/ConnectionContext';

jest.mock('../../constants/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('../../api/habitsApi', () => ({
  completeHabit: jest.fn(),
  getHabitsForDay: jest.fn(),
}));
jest.mock('../../constants/ConnectionContext', () => ({
  useConnection: jest.fn(),
}));

describe('HabitsCheckList', () => {
  const mockUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: '2023-01-01',
    successLimit: 80,
    failureLimit: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useConnection as jest.Mock).mockReturnValue({
      isConnected: true,
      isBackendReachable: true,
      setIsConnected: jest.fn(),
      setIsBackendReachable: jest.fn(),
      bannerMessage: null,
      setBannerMessage: jest.fn(),
    });
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <NavigationContainer>
        <PaperProvider>{ui}</PaperProvider>
      </NavigationContainer>
    );

  // Test: Renders with no habits
  it('renders with no habits', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { findByText } = renderWithProviders(<HabitsCheckList date="2023-11-23" />);

    expect(await findByText('No records for this day.')).toBeTruthy();
  });

  // Test: Renders with habits and toggles completion
  it('renders with habits and toggles completion', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([
      {"current": false, "date": "2023-11-23", "frequency": "daily", "habit_id": 1, "id": 702, "name": "Exercise", "status": false, "timestamp": "2025-12-07T17:16:13.263Z"}, 
      {"current": false, "date": "2023-11-23", "frequency": "daily", "habit_id": 2, "id": 703, "name": "Read", "status": true, "timestamp": "2025-12-07T17:16:13.992Z"},
    ]);

    const { getByText, findByTestId } = renderWithProviders(
      <HabitsCheckList date="2023-11-23" />
    );

    await waitFor(() => {
      expect(getByText('Exercise')).toBeTruthy();
      expect(getByText('Read')).toBeTruthy();
    });

    const toggleButton = await findByTestId('toggle-habit-1');

    await act(async () => {
      fireEvent.press(toggleButton);
    });

    await waitFor(() => {
      expect(completeHabit).toHaveBeenCalledWith(1, '2023-11-23');
    });
  });

  // Test: Shows "Add Habit" button for today
  it('shows Add Habit button today', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const today = new Date().toISOString().split('T')[0];

    const { getByText } = renderWithProviders(
      <HabitsCheckList date={today} />
    );

    const addButton = await getByText('Add Habit');

    await act(async () => {
      fireEvent.press(addButton);
    });

    // expect(mockNavigate).toHaveBeenCalledWith('habits');
  });

  // Test: Shows "No records for this day" for a future date
  it('shows no records for a future date', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { findByText } = renderWithProviders(<HabitsCheckList date="2030-12-01" />);

    expect(await findByText('No records for this day.')).toBeTruthy();
  });

  // Test: Shows "not active yet" for dates before user creation
  it('shows "not active yet" for dates before user creation', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { findByText } = renderWithProviders(<HabitsCheckList date="2022-12-31" />);

    expect(
      await findByText('Your account was not active on this day yet.')
    ).toBeTruthy();
  });
});