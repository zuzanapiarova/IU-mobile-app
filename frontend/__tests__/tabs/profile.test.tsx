import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { useUser } from '../../constants/UserContext';
import { useRouter } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';

jest.mock('../constants/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-native-modal-datetime-picker', () => () => null);

const mockUpdateUser = jest.fn();
const mockLogout = jest.fn();
const mockReplace = jest.fn();

describe('ProfileScreen', () => {
  const mockUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    themePreference: 'dark' as const,
    notificationsEnabled: true,
    successLimit: 80,
    failureLimit: 20,
    notificationTime: '18:00',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      logout: mockLogout,
    });
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() } as any);
  });

  // ----------------
  // 1. RENDER INITIAL USER DATA
  // ----------------
  it('renders initial user data', () => {
    const { getByDisplayValue, getByText } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    expect(getByDisplayValue('Alice')).toBeTruthy();
    expect(getByText('Dark Mode')).toBeTruthy();
    expect(getByText('Enable Notifications')).toBeTruthy();
    expect(getByDisplayValue('80')).toBeTruthy();
    expect(getByDisplayValue('20')).toBeTruthy();
  });
  
  // ----------------
  // 2. CHANGE NAME
  // ----------------
  it('updates name when Change Name button is pressed', async () => {
    const { getByDisplayValue, getByText } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const nameInput = getByDisplayValue('Alice');
    const changeButton = getByText('Change Name');
  
    fireEvent.changeText(nameInput, 'Bob');
    fireEvent.press(changeButton);
  
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'Bob' });
    });
  });
  
  // ----------------
  // 3. TOGGLE THEME
  // ----------------
  it('toggles theme preference', async () => {
    const { getAllByRole } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const switches = getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', false);
  
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ themePreference: 'light' });
    });
  });
  
  // ----------------
  // 4. TOGGLE NOTIFICATIONS
  // ----------------
  it('toggles notifications', async () => {
    const { getAllByRole } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const switches = getAllByRole('switch');
    fireEvent(switches[1], 'valueChange', false);
  
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ notificationsEnabled: false });
    });
  });
  
  // ----------------
  // 5. INVALID LIMITS DISABLE SAVE
  // ----------------
  it('disables Save Limits button if limits invalid', () => {
    const { getByText, getByDisplayValue } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const successInput = getByDisplayValue('80');
    const failureInput = getByDisplayValue('20');
  
    fireEvent.changeText(successInput, '10'); // less than failure
    const saveButton = getByText('Save Limits');
    expect(saveButton).toBeDisabled();
  });
  
  // ----------------
  // 6. SAVE LIMITS
  // ----------------
  it('saves valid limits', async () => {
    const { getByText, getByDisplayValue } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const successInput = getByDisplayValue('80');
    const failureInput = getByDisplayValue('20');
    fireEvent.changeText(successInput, '90');
    fireEvent.changeText(failureInput, '50');
  
    const saveButton = getByText('Save Limits');
    fireEvent.press(saveButton);
  
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ successLimit: 90, failureLimit: 50 });
    });
  });
  
  // ----------------
  // 7. LOGOUT AND NAVIGATION
  // ----------------
  it('calls logout and navigates when Logout button pressed', async () => {
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  
    const { getByText,getAllByText } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    // Press main logout button to open modal
    const logoutButton = getByText('Logout');
    fireEvent.press(logoutButton);
  
    // Press logout inside modal
    const logoutButtons = getAllByText('Logout');
    const modalLogoutButton = logoutButtons[1]; // modal button is second
    fireEvent.press(modalLogoutButton);
  
    // Assert that logout and navigation were called
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  // ----------------
  // 8. TIME PICKER CONFIRM
  // ----------------
  it('handles time picker confirm', () => {
    const { getByText } = render(
      <PaperProvider>
        <ProfileScreen />
      </PaperProvider>
    );
  
    const saveTimeButton = getByText('Save Time');
    fireEvent.press(saveTimeButton);
  
    // Simulate update of notification time
    expect(mockUpdateUser).toHaveBeenCalledTimes(0); // because initial and selected time are the same
  });
});