import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as userApi from '../api/userApi';
import { User } from '@/constants/interfaces';

jest.mock('axios');
jest.mock('expo-secure-store');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('userApi', () => {
  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: '2023-01-01',
    successLimit: 80,
    failureLimit: 20,
    notificationTime: '18:00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new user', async () => {
    const mockNewUser = { name: 'New User', email: 'newuser@example.com', password: 'password123' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockUser });

    const result = await userApi.addUser(mockNewUser.name, mockNewUser.email, mockNewUser.password);

    expect(mockedAxios.post).toHaveBeenCalledWith('/users', mockNewUser);
    expect(result).toEqual(mockUser);
  });

  it('should log in a user', async () => {
    const mockCredentials = { email: 'test@example.com', password: 'password123' };
    mockedAxios.post.mockResolvedValueOnce({ data: mockUser });

    const result = await userApi.loginUser(mockCredentials.email, mockCredentials.password);

    expect(mockedAxios.post).toHaveBeenCalledWith('/login', mockCredentials);
    expect(result).toEqual(mockUser);
  });

  it('should update a user in the backend', async () => {
    const mockUpdates = { name: 'Updated User' };
    const updatedUser = { ...mockUser, ...mockUpdates };
    mockedAxios.put.mockResolvedValueOnce({ data: updatedUser });

    const result = await userApi.updateUserBackend(mockUser.id, mockUpdates);

    expect(mockedAxios.put).toHaveBeenCalledWith(`/users/${mockUser.id}`, mockUpdates);
    expect(result).toEqual(updatedUser);
  });

  it('should attach token to every request', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('mock-token');

    // Mock a request to verify the interceptor behavior
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    await userApi.api.get('/test-endpoint'); // Trigger a request

    expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('token');
    expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', {
      headers: { Authorization: 'Bearer mock-token' },
    });
  });

  it('should not attach token if it does not exist', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

    // Mock a request to verify the interceptor behavior
    mockedAxios.get.mockResolvedValueOnce({ data: {} });

    await userApi.api.get('/test-endpoint'); // Trigger a request

    expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith('token');
    expect(mockedAxios.get).toHaveBeenCalledWith('/test-endpoint', {
      headers: {}, // No Authorization header
    });
  });
});