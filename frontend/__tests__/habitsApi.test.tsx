import axios from 'axios';
import * as habitsApi from '../api/habitsApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('habitsApi', () => {
  const mockUserId = 1;
  const mockHabitId = 123;
  const mockDate = '2023-11-16';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all habits for the logged-in user', async () => {
    const mockHabits = [{ id: 1, name: 'Habit 1' }, { id: 2, name: 'Habit 2' }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockHabits });

    const result = await habitsApi.getAllHabits(mockUserId);

    expect(mockedAxios.get).toHaveBeenCalledWith('/habits', { params: { userId: mockUserId } });
    expect(result).toEqual(mockHabits);
  });

  it('should add a new habit', async () => {
    const mockHabit = { id: 1, name: 'New Habit', frequency: 'daily' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockHabit });

    const result = await habitsApi.addHabit('New Habit', 'daily', mockUserId);

    expect(mockedAxios.post).toHaveBeenCalledWith('/habits', { name: 'New Habit', frequency: 'daily', userId: mockUserId });
    expect(result).toEqual(mockHabit);
  });

  it('should delete a habit', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.deleteHabit(mockHabitId);

    expect(mockedAxios.delete).toHaveBeenCalledWith(`/habits/${mockHabitId}`);
    expect(result).toEqual({});
  });

  it('should complete a habit', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.completeHabit(mockHabitId, mockDate);

    expect(mockedAxios.post).toHaveBeenCalledWith(`/habits/${mockHabitId}/complete`, { date: mockDate });
    expect(result).toEqual({});
  });

  it('should uncomplete a habit', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.uncompleteHabit(mockHabitId, mockDate);

    expect(mockedAxios.post).toHaveBeenCalledWith(`/habits/${mockHabitId}/uncomplete`, { date: mockDate });
    expect(result).toEqual({});
  });

  it('should fetch habits for a specific day', async () => {
    const mockHabits = [{ habitId: 1, streak: 5 }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockHabits });

    const result = await habitsApi.getHabitsForDay(mockUserId, true, mockDate);

    expect(mockedAxios.get).toHaveBeenCalledWith('/habits-for-day', {
      params: { userId: mockUserId, allowDeleted: true, date: mockDate },
    });
    expect(result).toEqual(mockHabits);
  });

  it('should initialize habit completions for a specific day', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    const result = await habitsApi.initializeHabitCompletionsForDay(mockDate);

    expect(mockedAxios.post).toHaveBeenCalledWith('/initialize-habit-completions', { date: mockDate });
    expect(result).toEqual({});
  });

  it('should fetch the most recent date from habit completions', async () => {
    const mockDate = '2023-11-15';
    mockedAxios.get.mockResolvedValueOnce({ data: { maxDate: mockDate } });

    const result = await habitsApi.getMostRecentDate();

    expect(mockedAxios.get).toHaveBeenCalledWith('/habits-completions/most-recent-date');
    expect(result).toEqual(mockDate);
  });

  it('should fetch the habit streak for a specific habit', async () => {
    const mockStreak = [{ habitId: mockHabitId, streak: 10 }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockStreak });

    const result = await habitsApi.getHabitStreak(mockUserId, mockHabitId, mockDate);

    expect(mockedAxios.get).toHaveBeenCalledWith('/habit-streaks', {
      params: { userId: mockUserId, habitId: mockHabitId, startsAfterDate: mockDate },
    });
    expect(result).toEqual(mockStreak);
  });
});