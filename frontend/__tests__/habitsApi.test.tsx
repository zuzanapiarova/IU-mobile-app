import * as SecureStore from 'expo-secure-store';
import { Habit } from '@/constants/interfaces'; // adjust if needed
jest.mock('expo-secure-store');

// -----------------
// MOCK AXIOS SETUP
// -----------------
const mockAxiosInstance = {
  post: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() }, // must exist for interceptor attachment
  },
};

// Mock axios BEFORE importing habitsApi
jest.doMock('axios', () => ({
  create: () => mockAxiosInstance,
}));

// Require habitsApi AFTER mocking axios
const habitsApi = require('../api/habitsApi');
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('habitsApi', () => {
  const mockUserId = 1;
  const mockHabitId = 123;
  const mockDate = '2023-11-16';
  const mockHabit: Habit = { 
                              id: mockHabitId, 
                              name: 'Test Habit', 
                              frequency: 'daily', 
                              date: '17-11-2025',
                              status: 1,
                              current: 1, 
                              timestamp: '1731710400000'
                            };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------
  // 1. ADD HABIT
  // -----------------
  it('should add a new habit', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockHabit });

    const result = await habitsApi.addHabit('Test Habit', 'daily', mockUserId);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/habits', {
      name: 'Test Habit',
      frequency: 'daily',
      userId: mockUserId,
    });
    expect(result).toEqual(mockHabit);
  });

  // -----------------
  // 2. GET HABIT BY ID
  // -----------------
  it('should get a habit by ID', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockHabit });

    const result = await habitsApi.getHabitById(mockHabitId);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/habits/${mockHabitId}`);
    expect(result).toEqual(mockHabit);
  });

  // -----------------
  // 3. DELETE HABIT
  // -----------------
  it('should delete a habit', async () => {
    mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.deleteHabit(mockHabitId);

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/habits/${mockHabitId}`);
    expect(result).toEqual({});
  });

  // -----------------
  // 4. UPDATE HABIT
  // -----------------
  it('should update a habit', async () => {
    const updatedHabit = { ...mockHabit, name: 'Updated Habit' };
    mockAxiosInstance.put.mockResolvedValueOnce({ data: updatedHabit });

    const result = await habitsApi.updateHabit(mockHabitId, 'Updated Habit', 'weekly');

    expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/habits/${mockHabitId}`, {
      name: 'Updated Habit',
      frequency: 'weekly',
    });
    expect(result).toEqual(updatedHabit);
  });

  // -----------------
  // 5. COMPLETE HABIT
  // -----------------
  it('should complete a habit', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.completeHabit(mockHabitId, mockDate);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/habits/${mockHabitId}/complete`, { date: mockDate });
    expect(result).toEqual({});
  });

  // -----------------
  // 6. UNCOMPLETE HABIT
  // -----------------
  it('should uncomplete a habit', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.uncompleteHabit(mockHabitId, mockDate);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/habits/${mockHabitId}/uncomplete`, { date: mockDate });
    expect(result).toEqual({});
  });

  // -----------------
  // 7. GET COMPLETED HABITS FOR DAY
  // -----------------
  it('should get completed habits for a specific day', async () => {
    const mockCompleted = [mockHabit];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockCompleted });

    const result = await habitsApi.getCompletedHabitsForDay(mockDate);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/habits/completed', { params: { date: mockDate } });
    expect(result).toEqual(mockCompleted);
  });

  // -----------------
  // 8. GET COMPLETION PERCENTAGE FOR DAY
  // -----------------
  it('should get completion percentage for a specific day', async () => {
    const mockPercentage = { date: mockDate, percentage: 80 };
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPercentage });

    const result = await habitsApi.getCompletionPercentageForDay(mockDate);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/completion-percentage', { params: { date: mockDate } });
    expect(result).toEqual(mockPercentage);
  });

  // -----------------
  // 9. GET HABITS FOR DAY
  // -----------------
  it('should get habits for a specific day', async () => {
    const mockDayHabits = [{ habitId: mockHabitId, streak: 5 }];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockDayHabits });

    const result = await habitsApi.getHabitsForDay(mockUserId, true, mockDate);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/habits-for-day', {
      params: { userId: mockUserId, allowDeleted: true, date: mockDate },
    });
    expect(result).toEqual(mockDayHabits);
  });

  // -----------------
  // 10. INITIALIZE HABIT COMPLETIONS
  // -----------------
  it('should initialize habit completions for a day', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.initializeHabitCompletionsForDay(mockDate);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/initialize-habit-completions', { date: mockDate });
    expect(result).toEqual({});
  });

  // -----------------
  // 11. GET MOST RECENT DATE
  // -----------------
  it('should get the most recent date from habit completions', async () => {
    const recentDate = '2023-11-15';
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { maxDate: recentDate } });

    const result = await habitsApi.getMostRecentDate();

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/habits-completions/most-recent-date');
    expect(result).toEqual(recentDate);
  });

  // -----------------
  // 12. GET HABIT STREAK
  // -----------------
  it('should get the habit streak for a specific habit', async () => {
    const mockStreak = [{ habitId: mockHabitId, streak: 10 }];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockStreak });

    const result = await habitsApi.getHabitStreak(mockUserId, mockHabitId, mockDate);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/habit-streaks', {
      params: { userId: mockUserId, habitId: mockHabitId, startsAfterDate: mockDate },
    });
    expect(result).toEqual(mockStreak);
  });

  // -----------------
  // 13. INTERCEPTOR ATTACH TOKEN
  // -----------------
  it('should attach token in interceptor', async () => {
    jest.resetModules();

    const mockedStore = require('expo-secure-store');
    mockedStore.getItemAsync = jest.fn().mockResolvedValue('mock-token');

    const mockAxios = {
      post: jest.fn(),
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() } },
    };
    jest.doMock('axios', () => ({ create: () => mockAxios }));

    let interceptorFn: any = null;
    mockAxios.interceptors.request.use.mockImplementation((fn: any) => {
      interceptorFn = fn;
    });

    require('../api/habitsApi');

    expect(interceptorFn).not.toBeNull();

    const config = await interceptorFn({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer mock-token');
  });

  // -----------------
  // 14. INTERCEPTOR TOKEN MISSING
  // -----------------
  it('should not attach token when missing', async () => {
    jest.resetModules();

    const mockedStore = require('expo-secure-store');
    mockedStore.getItemAsync = jest.fn().mockResolvedValue(null);

    const mockAxios = {
      post: jest.fn(),
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      interceptors: { request: { use: jest.fn() } },
    };
    jest.doMock('axios', () => ({ create: () => mockAxios }));

    let interceptorFn: any = null;
    mockAxios.interceptors.request.use.mockImplementation((fn: any) => {
      interceptorFn = fn;
    });

    require('../api/habitsApi');

    expect(interceptorFn).not.toBeNull();

    const config = await interceptorFn({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});
