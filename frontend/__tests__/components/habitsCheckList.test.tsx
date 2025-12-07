jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: jest.fn()
  };
});
jest.mock('expo-router', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HabitsCheckList from '../../components/HabitsCheckList';
import { useUser } from '../../constants/UserContext';
import { completeHabit, getHabitsForDay } from '../../api/habitsApi';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { useConnection } from '../../constants/ConnectionContext';
import { useNavigation } from 'expo-router';

jest.mock('../../constants/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('../../api/habitsApi', () => ({
  completeHabit: jest.fn(),
  getHabitsForDay: jest.fn(),
}));
jest.mock('../../constants/ConnectionContext', () => ({
  useConnection: jest.fn(() => ({
    isConnected: true,
    isBackendReachable: true,
    setIsConnected: jest.fn(),
    setIsBackendReachable: jest.fn(),
    bannerMessage: null,
    setBannerMessage: jest.fn(),
  })),
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

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContainer>
        <PaperProvider>{component}</PaperProvider>
      </NavigationContainer>
    );
  };

  // ----------------
  // 1. RENDER WITH NO HABITS
  // ----------------
  it('renders with no habits', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { getByText } = renderWithNavigation(<HabitsCheckList date="2023-11-23" />);

    await waitFor(() => {
      expect(getByText('No records for this day.')).toBeTruthy();
    });
  });

  // ----------------
  // 2. RENDER WITH HABITS
  // ----------------
  it('renders with habits and toggles completion', async () => {
    // Mock the API response
    (getHabitsForDay as jest.Mock).mockResolvedValue([
      { id: 11, habit_id: 1, name: 'Exercise', status: 0 },
      { id: 12, habit_id: 2, name: 'Read', status: 1 },
    ]);
  
    // Render the component
    const { findByText, findByTestId } = renderWithNavigation(<HabitsCheckList date="2023-11-23" />);
  
    // Wait for the habits to load and be rendered
    expect(await findByText('Exercise')).toBeTruthy();
    expect(await findByText('Read')).toBeTruthy();
  
    // Test toggling a habit's completion
    const toggleButton = await findByTestId('toggle-habit-1');
    await act(async () => {
      fireEvent.press(toggleButton);
    });
  
    // Verify that the API was called to complete the habit
    await waitFor(() => {
      expect(completeHabit).toHaveBeenCalledWith(1, '2023-11-23');
      expect(getHabitsForDay).toHaveBeenCalledWith(mockUser.id, false, '2023-11-23');
    });
  }); 

  // ----------------
  // 3. ADD HABIT BUTTON
  // ----------------
  it('renders the "Add Habit" button for today', async () => {
    // Mock the API response
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);
  
    // Render the component
    const { getByText } = renderWithNavigation(
      <HabitsCheckList date={new Date().toISOString().split('T')[0]} />
    );
  
    // Wait for the "Add Habit" button to be rendered
    await waitFor(() => {
      expect(getByText('Add Habit')).toBeTruthy();
    });
  
    // Test the "Add Habit" button functionality
    const addButton = getByText('Add Habit');
    await act(async () => {
      fireEvent.press(addButton);
    });
  
    // Verify navigation to the "habits" screen
    expect(useNavigation().navigate).toHaveBeenCalledWith('habits');
  });

  // ----------------
  // 4. NO RECORDS FOR A SPECIFIC DAY
  // ----------------
  it('shows "No records for this day" for a future date', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { getByText } = renderWithNavigation(<HabitsCheckList date="2042-12-01" />);

    await waitFor(() => {
      expect(getByText('No records for this day.')).toBeTruthy();
    });
  });

  // ----------------
  // 5. USER NOT ACTIVE YET
  // ----------------
  it('shows "Your account was not active on this day yet" for a past date', async () => {
    (getHabitsForDay as jest.Mock).mockResolvedValue([]);

    const { getByText } = renderWithNavigation(<HabitsCheckList date="2022-12-31" />);

    await waitFor(() => {
      expect(getByText('Your account was not active on this day yet.')).toBeTruthy();
    });
  });
});